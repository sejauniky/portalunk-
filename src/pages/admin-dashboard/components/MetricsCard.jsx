import React from 'react';
import { Icon } from '../../../components/Icon';

const MetricsCard = ({ title, value, change, changeType, icon, color = 'primary', onClick, clickable = false }) => {
  const getIconColor = (colorType) => {
    const colors = {
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
      secondary: 'text-secondary'
    };
    return colors?.[colorType] || colors?.primary;
  };

  const getChangeColor = (type) => {
    return type === 'positive' ? 'text-success' : type === 'negative' ? 'text-error' : 'text-muted-foreground';
  };

  return (
    <div 
      className={`bg-card border border-border rounded-lg p-6 transition-all duration-200 ${
        clickable 
          ? 'hover:shadow-md hover:border-primary/50 cursor-pointer hover:scale-105' 
          : 'hover:shadow-md'
      }`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {clickable && (
            <div className="flex items-center mt-2 text-xs text-primary">
              <Icon name="ArrowRight" size={12} className="mr-1" />
              <span>Clique para ver detalhes</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-transparent`}>
          <Icon name={icon} size={24} className={getIconColor(color)} />
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;
