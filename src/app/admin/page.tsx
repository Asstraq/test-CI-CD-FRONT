'use client';

import {
  deleteReportedTarget,
  getAdminReports,
  updateReportStatus,
} from '@/lib/api/reports.api';
import { me as getMe } from '@/lib/api/auth.api';
import { getToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';
import { Role } from '@/enum/roles';
import type { ReportItem, ReportStatus } from '@/type/reports';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function getDateLabel(date?: string | null) {
  if (!date) return 'Date inconnue';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function getUserName(name?: string, email?: string, handle?: string) {
  return name || handle || email || 'Utilisateur';
}

function getStatusColor(status: string) {
  if (status === 'OPEN') return 'error';
  if (status === 'IN_REVIEW') return 'warning';
  if (status === 'RESOLVED') return 'success';
  return 'default';
}

function renderTargetSummary(report: ReportItem) {
  if (!report.target) {
    return (
      <Typography variant="body2" sx={{ color: '#64748b' }}>
        Contenu deja supprime ou introuvable.
      </Typography>
    );
  }

  if (report.target.kind === 'REVIEW') {
    return (
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 700 }}>
          {report.target.review.media?.title || 'Publication'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#475569' }}>
          Auteur :{' '}
          {getUserName(
            report.target.review.user?.name,
            report.target.review.user?.email,
            report.target.review.user?.handle,
          )}
        </Typography>
        <Typography variant="body2" sx={{ color: '#0f172a' }}>
          {report.target.review.content || 'Aucun texte sur cette publication.'}
        </Typography>
      </Stack>
    );
  }

  if (report.target.kind === 'MESSAGE') {
    return (
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 700 }}>
          Message de{' '}
          {getUserName(
            report.target.message.sender?.name,
            report.target.message.sender?.email,
            report.target.message.sender?.handle,
          )}
        </Typography>
        <Typography variant="body2" sx={{ color: '#0f172a' }}>
          {report.target.message.content || 'Message vide.'}
        </Typography>
      </Stack>
    );
  }

  return (
    <Typography variant="body2" sx={{ color: '#64748b' }}>
      Type {report.target.kind} non affiche dans ce back office.
    </Typography>
  );
}

function ReportSection({
  title,
  reports,
  actionLoadingId,
  onStatusChange,
  onDeleteTarget,
}: {
  title: string;
  reports: ReportItem[];
  actionLoadingId: number | null;
  onStatusChange: (reportId: number, status: ReportStatus) => Promise<void>;
  onDeleteTarget: (reportId: number) => Promise<void>;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 4,
        bgcolor: 'rgba(255,255,255,0.92)',
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Chip
            label={`${reports.length} signalement${reports.length > 1 ? 's' : ''}`}
            sx={{ borderRadius: 999 }}
          />
        </Stack>

        {reports.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Aucun signalement dans cette section.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {reports.map((report, index) => (
              <Box key={report.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    borderColor: 'rgba(148,163,184,0.3)',
                    bgcolor: '#fff',
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={report.status}
                          color={getStatusColor(report.status) as never}
                        />
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {getDateLabel(report.createdAt)}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Signalé par{' '}
                        {getUserName(
                          report.reporter?.name,
                          report.reporter?.email,
                          report.reporter?.handle,
                        )}
                      </Typography>
                    </Stack>

                    <Typography variant="body2" sx={{ color: '#b45309' }}>
                      Motif : {report.reason}
                      {report.details ? ` · ${report.details}` : ''}
                    </Typography>

                    {renderTargetSummary(report)}

                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: 'stretch', md: 'center' }}
                    >
                      <TextField
                        select
                        size="small"
                        label="Statut"
                        value={report.status}
                        onChange={(event) =>
                          void onStatusChange(
                            report.id,
                            event.target.value as ReportStatus,
                          )
                        }
                        sx={{ minWidth: 180 }}
                        disabled={actionLoadingId === report.id}
                      >
                        <MenuItem value="OPEN">OPEN</MenuItem>
                        <MenuItem value="IN_REVIEW">IN_REVIEW</MenuItem>
                        <MenuItem value="RESOLVED">RESOLVED</MenuItem>
                        <MenuItem value="REJECTED">REJECTED</MenuItem>
                      </TextField>

                      {report.targetType === 'REVIEW' ||
                      report.targetType === 'MESSAGE' ? (
                        <Button
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteOutlineRoundedIcon />}
                          onClick={() => void onDeleteTarget(report.id)}
                          disabled={actionLoadingId === report.id}
                          sx={{ textTransform: 'none', borderRadius: 999 }}
                        >
                          Supprimer le contenu
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </Paper>
                {index < reports.length - 1 ? (
                  <Divider sx={{ my: 1.5 }} />
                ) : null}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, setUser } = useUserSession();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('OPEN');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      if (!getToken()) {
        router.replace('/auth');
        return;
      }

      if (user || !getToken()) return;

      try {
        setSessionLoading(true);
        const response = await getMe();
        if (!active) return;
        const nextUser = 'user' in response ? response.user : response;
        setUser({ user: nextUser });
      } catch {
        if (active) router.replace('/auth');
      } finally {
        if (active) setSessionLoading(false);
      }
    }

    void bootstrapSession();

    return () => {
      active = false;
    };
  }, [router, setUser, user]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) return;
    if (user.user.role !== Role.ADMIN) {
      router.replace('/');
    }
  }, [router, sessionLoading, user]);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      if (!user || user.user.role !== Role.ADMIN) return;

      try {
        setLoading(true);
        setError('');
        const nextReports = await getAdminReports({ status: statusFilter });
        if (!active) return;
        setReports(nextReports);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Impossible de charger les signalements.',
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, [statusFilter, user]);

  const publicationReports = useMemo(
    () => reports.filter((report) => report.targetType === 'REVIEW'),
    [reports],
  );
  const messageReports = useMemo(
    () => reports.filter((report) => report.targetType === 'MESSAGE'),
    [reports],
  );

  const handleStatusChange = async (reportId: number, status: ReportStatus) => {
    setActionLoadingId(reportId);
    setError('');

    try {
      const updated = await updateReportStatus(reportId, status);
      setReports((prev) =>
        prev.map((report) => (report.id === reportId ? updated : report)),
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Mise a jour impossible.',
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTarget = async (reportId: number) => {
    setActionLoadingId(reportId);
    setError('');

    try {
      await deleteReportedTarget(reportId);
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: 'RESOLVED',
                target: null,
              }
            : report,
        ),
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Suppression impossible.',
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (sessionLoading || (user && user.user.role !== Role.ADMIN)) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f6f1e8 0%, #e8eefb 100%)',
        py: { xs: 6, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.92)',
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Typography variant="overline" sx={{ color: '#b45309' }}>
                  Administration
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  Back office de modération
                </Typography>
                <Typography sx={{ color: '#64748b', mt: 1 }}>
                  Consultation des contenus signalés et actions de modération.
                </Typography>
              </Box>

              <TextField
                select
                size="small"
                label="Filtrer par statut"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as ReportStatus | '')
                }
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="OPEN">OPEN</MenuItem>
                <MenuItem value="IN_REVIEW">IN_REVIEW</MenuItem>
                <MenuItem value="RESOLVED">RESOLVED</MenuItem>
                <MenuItem value="REJECTED">REJECTED</MenuItem>
              </TextField>
            </Stack>
          </Paper>

          {error ? <Alert severity="error">{error}</Alert> : null}

          {loading ? (
            <Paper
              variant="outlined"
              sx={{
                p: 5,
                borderRadius: 4,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <CircularProgress />
            </Paper>
          ) : (
            <Stack spacing={3}>
              <ReportSection
                title="Publications signalées"
                reports={publicationReports}
                actionLoadingId={actionLoadingId}
                onStatusChange={handleStatusChange}
                onDeleteTarget={handleDeleteTarget}
              />
              <ReportSection
                title="Messages signalés"
                reports={messageReports}
                actionLoadingId={actionLoadingId}
                onStatusChange={handleStatusChange}
                onDeleteTarget={handleDeleteTarget}
              />
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
