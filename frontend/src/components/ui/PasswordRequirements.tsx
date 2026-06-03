import { getPasswordRequirementResults } from '../../lib/credentials';

interface PasswordRequirementsProps {
  id: string;
  password: string;
}

export function PasswordRequirements({ id, password }: PasswordRequirementsProps) {
  const requirements = getPasswordRequirementResults(password);

  return (
    <ul className="password-requirements" id={id} aria-label="Password requirements">
      {requirements.map((requirement) => (
        <li
          key={requirement.id}
          className={[
            'password-requirements__item',
            requirement.met ? 'password-requirements__item--met' : null,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="password-requirements__dot" aria-hidden="true" />
          <span>{requirement.label}</span>
        </li>
      ))}
    </ul>
  );
}
