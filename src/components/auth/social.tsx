'use client';

import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

import { Button } from '@/components/ui/button';

export const Social = () => (
  <div className='flex w-full items-center gap-x-2'>
    <Button size='lg' variant='outline' className='w-full'>
      <FcGoogle className='h-5 w-5' />
    </Button>{' '}
    <Button size='lg' variant='outline' className='w-full'>
      <FaGithub className='h-5 w-5' />
    </Button>
  </div>
);
