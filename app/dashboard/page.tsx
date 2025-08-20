'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spin } from 'antd';
import ManagerDashboard from '../../components/ManagerDashboard';
import WorkerDashboard from '../../components/WorkerDashboard';

const GET_USER = gql`
  query GetUser {
    me {
      id
      name
      email
      role
      auth0Id
    }
  }
`;

const CREATE_USER = gql`
  mutation CreateUser($email: String!, $name: String!, $role: Role!, $auth0Id: String!) {
    createUser(email: $email, name: $name, role: $role, auth0Id: $auth0Id) {
      id
      name
      email
      role
      auth0Id
    }
  }
`;

export default function Dashboard() {
  const { user: auth0User, isLoading: auth0Loading } = useUser();
  const router = useRouter();

  const { data, loading, error, refetch } = useQuery(GET_USER, {
    skip: auth0Loading || !auth0User,
    fetchPolicy: 'network-only',
  });

  const [createUser] = useMutation(CREATE_USER);

  useEffect(() => {
    if (auth0Loading) return;
    if (!auth0User) {
      router.push('/');
      return;
    }

    const setupUser = async () => {
      if (!data?.me) {
        try {
          console.log('Creating new user in DB with:', {
            email: auth0User.email,
            name: auth0User.name || auth0User.email,
            role: 'CARE_WORKER',
            auth0Id: auth0User.sub,
          });

          const result = await createUser({
            variables: {
              email: auth0User.email,
              name: auth0User.name || auth0User.email,
              role: 'MANAGER',
              auth0Id: auth0User.sub,
            },
          });

          console.log('User created:', result.data.createUser);

          // Refetch the user after creation
          await refetch();
        } catch (err) {
          console.error('User creation failed:', err);
        }
      }
    };
    setupUser();
  }, [auth0Loading, auth0User, data, createUser, refetch, router]);


  if (auth0Loading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 bg-mesh-gradient">
        <Spin size="large" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!auth0User) {
    return null; // Redirecting
  }

  const user = data?.me;
  console.log('User Data:', user);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 bg-mesh-gradient">
        <Spin size="large" tip="Setting up your account..." />
        <p>We’re setting up your account...</p>
      </div>
    );
  }

  return user.role === 'MANAGER'
    ? <ManagerDashboard user={user} />
    : <WorkerDashboard user={user} />;
}