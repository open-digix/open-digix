import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_ENDPOINT = 'auth:is-public';

export const Public = () => SetMetadata(IS_PUBLIC_ENDPOINT, true);
