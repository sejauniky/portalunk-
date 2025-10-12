import React from 'react';

interface BreadcrumbTrailProps {
  items?: Array<{ label: string; href?: string }>;
}

const BreadcrumbTrail: React.FC<BreadcrumbTrailProps> = ({ items = [] }) => {
  return (
    <nav className="text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
      <ol className="list-reset flex">
        {items.length === 0 ? (
          <li>Página atual</li>
        ) : (
          items.map((item, idx) => (
            <li key={idx} className="flex items-center">
              {item.href ? (
                <a href={item.href} className="hover:underline text-blue-600">{item.label}</a>
              ) : (
                <span>{item.label}</span>
              )}
              {idx < items.length - 1 && <span className="mx-2">/</span>}
            </li>
          ))
        )}
      </ol>
    </nav>
  );
};

export default BreadcrumbTrail;
