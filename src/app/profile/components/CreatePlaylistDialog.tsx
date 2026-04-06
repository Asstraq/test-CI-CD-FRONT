'use client';

import { dialogContentSx, dialogPaperSx } from './profilePage.shared';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import type { ChangeEvent } from 'react';

type Props = {
  open: boolean;
  createState: {
    name: string;
    description: string;
  };
  onClose: () => void;
  onCreate: () => void | Promise<void>;
  onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function CreatePlaylistDialog({
  open,
  createState,
  onClose,
  onCreate,
  onNameChange,
  onDescriptionChange,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: dialogPaperSx } }}
    >
      <DialogTitle>Créer une playlist</DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="Nom"
            value={createState.name}
            onChange={onNameChange}
          />
          <TextField
            label="Description"
            value={createState.description}
            onChange={onDescriptionChange}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={() => void onCreate()}
          disabled={!createState.name.trim()}
        >
          Créer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
