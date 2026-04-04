'use client';

import { createReport } from '@/lib/api/reports.api';
import {
  REPORT_REASONS,
  type ReportReason,
  type ReportTargetType,
} from '@/type/reports';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

type ReportContentDialogProps = {
  open: boolean;
  onClose: () => void;
  onReported?: (message: string) => void;
  targetType: ReportTargetType;
  targetId: number;
  title: string;
  description?: string;
};

const REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Harcèlement',
  HATE: 'Haine',
  NSFW: 'NSFW',
  VIOLENCE: 'Violence',
  SCAM: 'Arnaque',
  IMPERSONATION: 'Usurpation',
  MISINFORMATION: 'Désinformation',
  OTHER: 'Autre',
};

export default function ReportContentDialog({
  open,
  onClose,
  onReported,
  targetType,
  targetId,
  title,
  description,
}: ReportContentDialogProps) {
  const [reason, setReason] = useState<ReportReason>('HARASSMENT');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setReason('HARASSMENT');
    setDetails('');
    setSubmitting(false);
    setError('');
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      await createReport({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      resetForm();
      onReported?.('Signalement envoye a la moderation.');
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Signalement impossible.',
      );
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {description ? (
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {description}
            </Typography>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            select
            label="Motif"
            value={reason}
            onChange={(event) => setReason(event.target.value as ReportReason)}
          >
            {REPORT_REASONS.map((item) => (
              <MenuItem key={item} value={item}>
                {REASON_LABELS[item]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            multiline
            minRows={3}
            maxRows={6}
            placeholder="Explique brièvement ce qui pose problème."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Fermer
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Envoi...' : 'Envoyer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
