'use client';

import ReportContentDialog from '@/components/ReportContentDialog';
import {
  createReviewComment,
  getReviewComments,
} from '@/lib/api/feed-interactions.api';
import { getToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';
import { useReviewLikes } from '@/hooks/useReviewLikes';
import { buildProfileHref } from '@/lib/profile/profileHref';
import type { FeedComment, FeedLike, FeedShare, FeedUser } from '@/type/feed';
import TrackPreviewArtwork from '@/components/TrackPreviewArtwork';
import AlbumRoundedIcon from '@mui/icons-material/AlbumRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import MicExternalOnRoundedIcon from '@mui/icons-material/MicExternalOnRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import SupervisedUserCircleRoundedIcon from '@mui/icons-material/SupervisedUserCircleRounded';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type FeedPostProps = {
  share: FeedShare;
  author: FeedUser;
};

function getDateLabel(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function getSharedMeta(share: FeedShare): {
  kindLabel: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
} {
  if (share.shared.kind === 'TRACK') {
    return {
      kindLabel: 'Son',
      title: share.shared.title,
      subtitle: share.shared.album
        ? `${share.shared.artist} · ${share.shared.album}`
        : share.shared.artist,
      imageUrl: share.shared.imageUrl,
    };
  }

  if (share.shared.kind === 'ALBUM') {
    return {
      kindLabel: 'Album',
      title: share.shared.title,
      subtitle: share.shared.year
        ? `${share.shared.artist} · ${share.shared.year}`
        : share.shared.artist,
      imageUrl: share.shared.imageUrl,
    };
  }

  return {
    kindLabel: 'Artiste',
    title: share.shared.name,
    subtitle: share.shared.genres?.join(' · ') ?? 'Artiste recommande',
    imageUrl: share.shared.imageUrl,
  };
}

function getSharedIcon(kind: FeedShare['shared']['kind']) {
  if (kind === 'TRACK') return <GraphicEqRoundedIcon fontSize="small" />;
  if (kind === 'ALBUM') return <AlbumRoundedIcon fontSize="small" />;
  return <MicExternalOnRoundedIcon fontSize="small" />;
}

export default function FeedPost({ share, author }: FeedPostProps) {
  const searchParams = useSearchParams();
  const { user } = useUserSession();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isPublic = share.visibility === 'PUBLIC';
  const sharedMeta = getSharedMeta(share);
  const albumHref =
    share.shared.kind === 'ALBUM' && share.shared.spotifyId
      ? `/album/${share.shared.spotifyId}`
      : null;
  const content = share.content.trim();
  const authorInitial = author.name.trim().charAt(0).toUpperCase();
  const authorHref = buildProfileHref(author);
  const isAuthenticated = Boolean(getToken());
  const currentUserId = user?.user.id ? String(user.user.id) : null;
  const reviewId = share.reviewId;
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(
    Array.isArray(share.initialComments) && share.initialComments.length > 0,
  );
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(
    Array.isArray(share.initialComments) && share.initialComments.length > 0,
  );
  const [commentsError, setCommentsError] = useState('');
  const [comments, setComments] = useState<FeedComment[]>(
    share.initialComments ?? [],
  );
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentsAutoOpened, setCommentsAutoOpened] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  const {
    canInteract,
    likeEntries,
    likeLoading,
    likedByMe,
    likes,
    likesError,
    likesLoaded,
    likesLoading,
    refreshLikes,
    toggleLike,
  } = useReviewLikes({
    reviewId,
    initialLikes: share.likes,
    initialLikedByMe: share.likedByMe,
  });
  const commentsCount = Math.max(share.comments, comments.length);
  const canReport =
    isAuthenticated &&
    typeof reviewId === 'number' &&
    (!currentUserId || String(author.id) !== currentUserId);

  const loadComments = useCallback(async () => {
    if (commentsLoading || typeof reviewId !== 'number') return;

    setCommentsLoading(true);
    setCommentsError('');

    try {
      const nextComments = await getReviewComments(String(reviewId));
      setComments(nextComments);
      setCommentsLoaded(true);
    } catch (error) {
      setCommentsError(
        error instanceof Error
          ? error.message
          : 'Impossible de charger les commentaires.',
      );
    } finally {
      setCommentsLoading(false);
    }
  }, [commentsLoading, reviewId]);

  useEffect(() => {
    setLikesDialogOpen(false);
    setCommentsAutoOpened(false);
  }, [share.id]);

  useEffect(() => {
    if (
      typeof reviewId !== 'number' ||
      commentsLoaded ||
      commentsLoading ||
      share.comments <= 0
    ) {
      return;
    }

    void loadComments();
  }, [commentsLoaded, commentsLoading, loadComments, reviewId, share.comments]);

  useEffect(() => {
    const targetReviewId = searchParams.get('reviewId');
    const shouldOpenComments = searchParams.get('openComments') === '1';

    if (
      !shouldOpenComments ||
      commentsAutoOpened ||
      typeof reviewId !== 'number' ||
      targetReviewId !== String(reviewId)
    ) {
      return;
    }

    setCommentsVisible(true);
    setCommentsAutoOpened(true);

    if (!commentsLoaded && !commentsLoading) {
      void loadComments();
    }
  }, [
    commentsAutoOpened,
    commentsLoaded,
    commentsLoading,
    loadComments,
    reviewId,
    searchParams,
  ]);

  const handleToggleComments = async () => {
    const nextVisible = !commentsVisible;
    setCommentsVisible(nextVisible);

    if (
      nextVisible &&
      !commentsLoaded &&
      !commentsLoading &&
      typeof reviewId === 'number'
    ) {
      await loadComments();
    }
  };

  const handleOpenLikesDialog = async () => {
    setLikesDialogOpen(true);

    if (!likesLoaded && !likesLoading && typeof reviewId === 'number') {
      await refreshLikes();
    }
  };

  const handleCloseLikesDialog = () => {
    setLikesDialogOpen(false);
  };

  const handleCloseReport = () => {
    setReportOpen(false);
  };

  const handleReportSuccess = (message: string) => {
    setReportSuccess(message);
  };

  const handleSubmitComment = async () => {
    if (
      !canInteract ||
      commentSubmitting ||
      !commentDraft.trim() ||
      typeof reviewId !== 'number'
    )
      return;

    setCommentSubmitting(true);
    setCommentsError('');

    try {
      const created = await createReviewComment(
        String(reviewId),
        commentDraft.trim(),
      );
      if (created) {
        setComments((prev) => [...prev, created]);
      } else {
        setCommentsLoaded(false);
        await loadComments();
      }
      setCommentDraft('');
    } catch (error) {
      setCommentsError(
        error instanceof Error
          ? error.message
          : 'Impossible d envoyer le commentaire.',
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const renderLike = (entry: FeedLike, index: number) => {
    const likeAuthorHref = buildProfileHref(entry.user);

    return (
      <Paper
        key={`${entry.user.id}-${entry.createdAt}-${index}`}
        variant="outlined"
        sx={{
          p: 1.25,
          borderRadius: 2,
          borderColor: 'rgba(112, 130, 180, 0.18)',
          backgroundColor: '#fafbff',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          {likeAuthorHref ? (
            <Link
              href={likeAuthorHref}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              <Avatar src={entry.user.avatarUrl || undefined}>
                {entry.user.name.charAt(0).toUpperCase()}
              </Avatar>
            </Link>
          ) : (
            <Avatar src={entry.user.avatarUrl || undefined}>
              {entry.user.name.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {likeAuthorHref ? (
              <Typography
                component={Link}
                href={likeAuthorHref}
                sx={{
                  fontWeight: 700,
                  color: '#1b2130',
                  textDecoration: 'none',
                  display: 'block',
                  '&:hover': { textDecoration: 'underline' },
                }}
                noWrap
              >
                {entry.user.name}
              </Typography>
            ) : (
              <Typography sx={{ fontWeight: 700 }} noWrap>
                {entry.user.name}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: '#5c6780' }} noWrap>
              {entry.user.handle || entry.user.email || 'Utilisateur'}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#75819a' }}>
            {getDateLabel(entry.createdAt)}
          </Typography>
        </Stack>
      </Paper>
    );
  };

  const renderComment = (comment: FeedComment) => {
    const commentAuthorHref = buildProfileHref(comment.author);

    return (
      <Stack
        key={comment.id}
        direction="row"
        spacing={1.25}
        alignItems="flex-start"
      >
        {commentAuthorHref ? (
          <Link
            href={commentAuthorHref}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <Avatar
              src={comment.author.avatarUrl || undefined}
              alt={comment.author.name}
              sx={{ width: 32, height: 32 }}
            >
              {comment.author.name.charAt(0).toUpperCase()}
            </Avatar>
          </Link>
        ) : (
          <Avatar
            src={comment.author.avatarUrl || undefined}
            alt={comment.author.name}
            sx={{ width: 32, height: 32 }}
          >
            {comment.author.name.charAt(0).toUpperCase()}
          </Avatar>
        )}
        <Paper
          variant="outlined"
          sx={{
            p: 1.25,
            borderRadius: 2,
            flex: 1,
            borderColor: 'rgba(112, 130, 180, 0.18)',
            backgroundColor: '#fafbff',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            {commentAuthorHref ? (
              <Typography
                component={Link}
                href={commentAuthorHref}
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#1b2130',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {comment.author.name}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {comment.author.name}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: '#75819a' }}>
              {getDateLabel(comment.createdAt)}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {comment.content}
          </Typography>
        </Paper>
      </Stack>
    );
  };

  return (
    <Paper
      id={
        typeof reviewId === 'number'
          ? `feed-review-${reviewId}`
          : `feed-share-${share.id}`
      }
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: '1px solid rgba(40, 52, 82, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {authorHref ? (
            <Link
              href={authorHref}
              style={{
                minWidth: 0,
                color: 'inherit',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar src={author.avatarUrl || undefined} alt={author.name}>
                  {authorInitial || 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: '#1b2130' }}>
                    {author.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5c6780' }}>
                    {author.handle} · {getDateLabel(share.createdAt)}
                  </Typography>
                </Box>
              </Stack>
            </Link>
          ) : (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar src={author.avatarUrl || undefined} alt={author.name}>
                {authorInitial || 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, color: '#1b2130' }}>
                  {author.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#5c6780' }}>
                  {author.handle} · {getDateLabel(share.createdAt)}
                </Typography>
              </Box>
            </Stack>
          )}
          <Chip
            size="small"
            icon={
              isPublic ? (
                <PublicRoundedIcon fontSize="small" />
              ) : (
                <SupervisedUserCircleRoundedIcon fontSize="small" />
              )
            }
            label={isPublic ? 'Public' : 'Abonnes'}
            sx={{ ml: 'auto', borderRadius: 2 }}
          />
        </Stack>

        {content ? (
          <Typography sx={{ color: '#273248' }}>{content}</Typography>
        ) : (
          <Typography sx={{ color: '#5c6780', fontStyle: 'italic' }}>
            A partage ce media dans le feed.
          </Typography>
        )}

        <Paper
          variant="outlined"
          component={albumHref ? Link : 'div'}
          href={albumHref ?? undefined}
          sx={{
            p: 1.5,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            textDecoration: 'none',
            backgroundColor: '#f6f8ff',
            borderColor: 'rgba(112, 130, 180, 0.25)',
            transition: 'border-color 120ms ease, transform 120ms ease',
            '&:hover': albumHref
              ? {
                  borderColor: 'rgba(56, 88, 170, 0.45)',
                  transform: 'translateY(-1px)',
                }
              : undefined,
          }}
        >
          {share.shared.kind === 'TRACK' ? (
            <TrackPreviewArtwork
              trackId={share.shared.spotifyId}
              imageUrl={sharedMeta.imageUrl}
              alt={sharedMeta.title}
              size={56}
            />
          ) : (
            <Avatar
              variant="rounded"
              src={sharedMeta.imageUrl || undefined}
              alt={sharedMeta.title}
              sx={{ width: 56, height: 56 }}
            />
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={getSharedIcon(share.shared.kind)}
                label={sharedMeta.kindLabel}
                sx={{ height: 22, borderRadius: 1.5 }}
              />
              {share.rating > 0 ? (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <StarRoundedIcon sx={{ fontSize: 16, color: '#f59f00' }} />
                  <Typography variant="caption" sx={{ color: '#4b5670' }}>
                    {share.rating}/5
                  </Typography>
                </Stack>
              ) : null}
            </Stack>
            <Typography
              sx={{ fontWeight: 700, color: '#1b2130', mt: 0.5 }}
              noWrap
            >
              {sharedMeta.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#54607a' }} noWrap>
              {sharedMeta.subtitle}
            </Typography>
          </Box>
        </Paper>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ color: '#5f6f92' }}
          justifyContent={isMobile ? 'space-between' : 'flex-start'}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              startIcon={
                likeLoading || (likesLoading && canInteract) ? (
                  <CircularProgress size={14} />
                ) : likedByMe ? (
                  <FavoriteRoundedIcon fontSize="small" />
                ) : (
                  <FavoriteBorderRoundedIcon fontSize="small" />
                )
              }
              onClick={() => void toggleLike()}
              disabled={!canInteract || likeLoading || !likesLoaded}
              sx={{
                color: likedByMe ? '#d9485f' : '#5f6f92',
                minWidth: 0,
                px: 1,
              }}
            >
              {likes}
            </Button>
            <Button
              size="small"
              onClick={() => void handleOpenLikesDialog()}
              disabled={typeof reviewId !== 'number' || likeLoading}
              sx={{ color: '#5f6f92', minWidth: 0, px: 1 }}
            >
              Voir les likes
            </Button>
          </Stack>
          <Button
            size="small"
            startIcon={<ChatBubbleOutlineRoundedIcon fontSize="small" />}
            onClick={() => void handleToggleComments()}
            disabled={!canInteract && share.comments <= 0}
            sx={{
              color: '#5f6f92',
              minWidth: 0,
              px: 1,
              alignSelf: 'flex-start',
            }}
          >
            {commentsCount}
          </Button>
          {canReport ? (
            <Button
              size="small"
              startIcon={<FlagRoundedIcon fontSize="small" />}
              onClick={() => setReportOpen(true)}
              sx={{ color: '#5f6f92', minWidth: 0, px: 1 }}
            >
              Signaler
            </Button>
          ) : null}
        </Stack>

        {likesError ? (
          <Typography variant="body2" sx={{ color: '#c62828' }}>
            {likesError}
          </Typography>
        ) : null}

        <Collapse in={commentsVisible} unmountOnExit>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            {commentsLoading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2">
                  Chargement des commentaires...
                </Typography>
              </Stack>
            ) : null}

            {commentsError ? (
              <Typography variant="body2" sx={{ color: '#c62828' }}>
                {commentsError}
              </Typography>
            ) : null}

            {!commentsLoading && comments.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#5c6780' }}>
                Aucun commentaire pour le moment.
              </Typography>
            ) : null}

            {comments.map(renderComment)}

            {canInteract ? (
              <Stack direction="row" spacing={1} alignItems="flex-end">
                <TextField
                  fullWidth
                  size="small"
                  label="Ajouter un commentaire"
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  multiline
                  minRows={1}
                  maxRows={4}
                />
                <IconButton
                  color="primary"
                  onClick={handleSubmitComment}
                  disabled={commentSubmitting || !commentDraft.trim()}
                >
                  {commentSubmitting ? (
                    <CircularProgress size={18} />
                  ) : (
                    <SendRoundedIcon />
                  )}
                </IconButton>
              </Stack>
            ) : isAuthenticated ? (
              <Typography variant="body2" sx={{ color: '#5c6780' }}>
                Interactions indisponibles sur ce post tant que l&apos;id de
                review n&apos;est pas fourni par le feed.
              </Typography>
            ) : null}
          </Stack>
        </Collapse>
      </Stack>

      <Dialog
        open={likesDialogOpen}
        onClose={handleCloseLikesDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Likes ({likes})</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.25}>
            {likesLoading && !likesLoaded ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2">
                  Chargement des utilisateurs...
                </Typography>
              </Stack>
            ) : null}

            {!likesLoading && likesLoaded && likeEntries.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#5c6780' }}>
                Aucun like pour le moment.
              </Typography>
            ) : null}

            {likesLoaded ? likeEntries.map(renderLike) : null}
          </Stack>
        </DialogContent>
      </Dialog>

      {typeof reviewId === 'number' ? (
        <ReportContentDialog
          open={reportOpen}
          onClose={handleCloseReport}
          onReported={handleReportSuccess}
          targetType="REVIEW"
          targetId={reviewId}
          title="Signaler cette publication"
          description="Explique a la moderation pourquoi cette publication pose probleme."
        />
      ) : null}

      <Snackbar
        open={Boolean(reportSuccess)}
        autoHideDuration={4000}
        onClose={() => setReportSuccess('')}
        message={reportSuccess}
      />
    </Paper>
  );
}
