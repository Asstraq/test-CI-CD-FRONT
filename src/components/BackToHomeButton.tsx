'use client';

import Link from 'next/link';
import { Button } from '@mui/material';

export default function BackToHomeButton() {
  return (
    <Button
      component={Link}
      href="/"
      variant="text"
      sx={{ textTransform: 'none', mb: 2 }}
    >
      Retour a l&apos;accueil
    </Button>
  );
}
