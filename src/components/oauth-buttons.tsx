'use client';

import { getGoogleAuthUrl } from '@/lib/api/auth.api';
import { Button, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Image from 'next/image';

const Wrapper = styled('div')({
  marginTop: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
});

const SectionTitle = styled(Typography)({
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#6b7280',
  textAlign: 'center',
});

export function OAuthButtons() {
  const handleClick = () => {
    window.location.assign(getGoogleAuthUrl());
  };

  return (
    <Wrapper>
      <SectionTitle>Ou continuer avec</SectionTitle>
      <Stack spacing={1.2}>
        <Button
          variant="outlined"
          onClick={handleClick}
          sx={{
            textTransform: 'none',
            borderColor: 'rgba(31, 41, 55, 0.2)',
            color: '#1f2937',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'rgba(15, 23, 42, 0.03)',
            },
          }}
        >
          <Image
            width={24}
            height={24}
            alt="logo of google"
            src="/logoOauth/google.png"
            style={{ marginRight: 12 }}
          />
          Continuer avec Google
        </Button>
      </Stack>
    </Wrapper>
  );
}
