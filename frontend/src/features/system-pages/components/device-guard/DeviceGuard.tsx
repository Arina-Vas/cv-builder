'use client';

import type { ReactNode } from 'react';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { MOBILE_QUERY } from '../../system-pages.constants';
import { DeviceErrorPage } from '../device-error-page/DeviceErrorPage';
import s from './DeviceGuard.module.css';

export function DeviceGuard({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);

  return (
    <>
      {!isMobile && <div className={s.app}>{children}</div>}
      <div className={s.deviceError}>
        <DeviceErrorPage />
      </div>
    </>
  );
}
