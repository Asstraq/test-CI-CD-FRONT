'use client';
import { useAuth } from '@/hooks/useAuth';
import { getToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';
import { Button, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
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
};

const AuthPage = () => {
  const { signIn } = useAuth();
  const { user } = useUserSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    await signIn(data.login, data.password);
    console.log(user);
    console.log(getToken());
  };
  return (
    <Page>
      <Card>
        <Title>Connexion</Title>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            placeholder="login"
            fullWidth
            size="small"
            {...register('login', { required: true })}
          />
          {errors.login && <FieldError>Ce champ est requis</FieldError>}

          <TextField
            placeholder="password"
            type="password"
            fullWidth
            size="small"
            {...register('password', { required: true })}
          />
          {errors.password && <FieldError>Ce champ est requis</FieldError>}

          <SubmitButton type="submit" variant="contained" fullWidth>
            Se connecter
          </SubmitButton>
        </Form>
      </Card>
    </Page>
  );
};

export default AuthPage;
