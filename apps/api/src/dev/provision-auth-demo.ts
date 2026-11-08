import { provisionAuthDemo } from './auth-demo-provisioner';

void provisionAuthDemo()
  .then((result) => {
    console.log('Synthetic auth demo provisioned');
    console.log(`Keycloak subject: ${result.keycloakSubject}`);
    console.log(`DigiX identity user: ${result.identityUserId}`);
    console.log(`Tenant: ${result.tenantId}`);
    console.log(`Membership: ${result.membershipId}`);
    console.log(`Roles: ${result.roles.join(', ')}`);
  })
  .catch((error: unknown) => {
    console.error('Synthetic auth demo provisioning failed', error);
    process.exitCode = 1;
  });
