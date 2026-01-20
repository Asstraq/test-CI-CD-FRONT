'use client';
import { OAuthButtons } from '@/components/oauth-buttons';
import { useAuth } from '@/hooks/useAuth';
import { Button, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

const Page = styled('div')({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background:
    'radial-gradient(1200px 600px at 20% -10%, #f7e8d7 0%, transparent 60%), radial-gradient(900px 500px at 120% 0%, #d9efe8 0%, transparent 55%), #f4f4ef',
});

const Card = styled('div')({
  width: '100%',
  maxWidth: '420px',
  padding: '32px',
  borderRadius: '20px',
  backgroundColor: '#ffffff',
  boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
  border: '1px solid rgba(15, 23, 42, 0.06)',
});

const Title = styled(Typography)({
  fontSize: '24px',
  fontWeight: 700,
  textAlign: 'center',
  marginBottom: '24px',
  color: '#1f2937',
});

const Form = styled('form')({
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
});

const FieldError = styled('span')({
  fontSize: '12px',
  color: '#c2410c',
});

const SwitchHint = styled(Typography)({
  marginTop: '12px',
  fontSize: '14px',
  color: '#6b7280',
  textAlign: 'center',
});

const SubmitButton = styled(Button)({
  marginTop: '8px',
  padding: '10px 16px',
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  boxShadow: '0 10px 18px rgba(234, 88, 12, 0.3)',
});

type Inputs = {
  login: string;
  password: string;
  nom: string;
  confirmPassword: string;
};

const AuthPage = () => {
  const [isConnection, setIsConnection] = useState<boolean>(true);
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();
  const password = watch('password');
  const onSubmit: SubmitHandler<Omit<Inputs, 'confirmPassword'>> = async (
    data,
  ) => {
    if (isConnection) {
      const user = await signIn(data.login, data.password);
      if (user) {
        router.push('/');
      }
    } else {
      const user = await signUp(data.login, data.password, data.nom);
      if (user) {
        router.push('/');
      }
    }
  };
  return (
    <Page>
      <Card>
        {isConnection ? <Title>Connexion</Title> : <Title>Inscription</Title>}
        <Form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            placeholder="Email"
            fullWidth
            size="small"
            {...register('login', { required: true })}
          />
          {errors.login && <FieldError>Ce champ est requis</FieldError>}

          {!isConnection && (
            <TextField
              placeholder="Nom"
              fullWidth
              size="small"
              {...register('nom', { required: true })}
            />
          )}
          {errors.login && <FieldError>Ce champ est requis</FieldError>}

          <TextField
            placeholder="Mot de passe"
            type="password"
            fullWidth
            size="small"
            {...register('password', { required: true })}
          />
          {errors.password && <FieldError>Ce champ est requis</FieldError>}

          {!isConnection && (
            <TextField
              placeholder="Confirmer le mot de passe"
              type="password"
              fullWidth
              size="small"
              {...register('confirmPassword', {
                required: true,
                validate: (value) =>
                  value === password || 'Les champs ne sont pas identiques',
              })}
            />
          )}
          {errors.confirmPassword?.message && (
            <FieldError>{errors.confirmPassword.message}</FieldError>
          )}
          {errors.confirmPassword?.type === 'required' && (
            <FieldError>Ce champ est requis</FieldError>
          )}

          <SubmitButton type="submit" variant="contained" fullWidth>
            {isConnection ? 'Se connecter' : "S'inscrire"}
          </SubmitButton>

          <OAuthButtons />

          <SwitchHint>
            {isConnection
              ? "Vous n'avez pas encore de compte?"
              : 'Vous avez déjà un compte ?'}
          </SwitchHint>
          <Button
            variant="text"
            onClick={() => setIsConnection(!isConnection)}
            sx={{ textTransform: 'none' }}
          >
            {isConnection ? 'Inscrivez vous' : 'Connectez vous'}
          </Button>
        </Form>
      </Card>
    </Page>
  );
};

export default AuthPage;
