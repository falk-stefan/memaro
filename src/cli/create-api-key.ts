import { sequelizeClient } from '../db/sequelize.js';
import { OrgEntity } from '../db/table/org.entity.js';
import { UserEntity } from '../db/table/user.entity.js';
import { ApiKeyEntity } from '../db/table/api-key.entity.js';
import { generateApiKey } from '../auth.js';

/**
 * Issues an API key out-of-band for a user, creating the org/user if they
 * don't exist yet. This is the only way to obtain a key today — API keys
 * are a stopgap credential for agents, not the human login story (SSO is
 * deferred to Milestone 7).
 *
 * Usage:
 *   pnpm create-api-key --org "Acme" --email agent@acme.dev \
 *     [--name "CI Agent"] [--label "ci key"] [--service-account]
 */

type Flags = {
  org: string;
  email: string;
  name?: string;
  label?: string;
  serviceAccount: boolean;
};

function parseFlags(argv: string[]): Flags {
  const get = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    return index === -1 ? undefined : argv[index + 1];
  };

  const org = get('--org');
  const email = get('--email');

  if (!org || !email) {
    throw new Error(
      'Usage: create-api-key --org <name> --email <email> [--name <display name>] [--label <label>] [--service-account]',
    );
  }

  return {
    org,
    email,
    name: get('--name'),
    label: get('--label'),
    serviceAccount: argv.includes('--service-account'),
  };
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  await sequelizeClient.sync();

  const [org] = await OrgEntity.findOrCreate({ where: { name: flags.org } });

  const [user] = await UserEntity.findOrCreate({
    where: { email: flags.email, orgId: org.id },
    defaults: {
      orgId: org.id,
      email: flags.email,
      displayName: flags.name ?? flags.email,
      isServiceAccount: flags.serviceAccount,
    },
  });

  const { rawKey, keyHash } = generateApiKey();
  await ApiKeyEntity.create({ userId: user.id, keyHash, label: flags.label ?? null });

  console.log(`Issued API key for ${user.email} (org "${org.name}"):\n`);
  console.log(rawKey);
  console.log('\nStore this now — it is hashed at rest and cannot be shown again.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error while creating API key:', error);
    process.exit(1);
  });
