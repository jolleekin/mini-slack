import { JSX } from "react";

function MessageIcon(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function WorkspaceIcon(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function FileIcon(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

const iconConfig = [
  { icon: <MessageIcon />, iconBg: "bg-accent-a3", iconColor: "text-accent-11" },
  { icon: <WorkspaceIcon />, iconBg: "bg-success-a3", iconColor: "text-success-11" },
  { icon: <FileIcon />, iconBg: "bg-warning-a3", iconColor: "text-warning-11" },
] as const;

interface FeatureInput {
  name: string;
  description: string;
}

interface FeaturesSectionProps {
  sectionLabel: string;
  heading: string;
  subheading: string;
  features: FeatureInput[];
}

export function FeaturesSection({ sectionLabel, heading, subheading, features }: FeaturesSectionProps): JSX.Element {
  return (
    <section aria-labelledby="features-heading" className="relative py-20 sm:py-28">
      {/* Faint top separator gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-gray-6 to-transparent"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section label + heading */}
        <div className="flex flex-col items-center gap-3 mb-14 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-11">
            {sectionLabel}
          </span>
          <h2
            id="features-heading"
            className="text-2xl sm:text-3xl font-bold text-gray-12"
          >
            {heading}
          </h2>
          <p className="text-gray-11 max-w-lg">
            {subheading}
          </p>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const { icon, iconBg, iconColor } = iconConfig[index % iconConfig.length];
            return (
              <li key={feature.name}>
                <div className="group relative bg-gray-2 border border-gray-6 hover:border-accent-a6 rounded-2xl p-7 h-full flex flex-col gap-5 transition-colors">
                  {/* Subtle inner glow on hover */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-accent-a2"
                  />
                  {/* Icon pill */}
                  <div
                    className={`relative w-11 h-11 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}
                  >
                    {icon}
                  </div>
                  <div className="relative flex flex-col gap-2">
                    <p className="text-base font-semibold text-gray-12">
                      {feature.name}
                    </p>
                    <p className="text-sm text-gray-11 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Faint bottom separator gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-gray-6 to-transparent"
      />
    </section>
  );
}
