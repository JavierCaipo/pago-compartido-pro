import type { Metadata } from 'next';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
  title: 'Titanium OS | Ecosistema B2B2C',
  description: 'Arquitectura Multi-Tenant B2B2C. Experiencia premium sin fricción. Predicción de rotación y yield management impulsado por datos.',
};

export default function Page() {
  return <LandingClient />;
}
