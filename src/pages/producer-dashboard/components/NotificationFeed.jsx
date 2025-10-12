import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const NotificationFeed = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const [filter, setFilter] = useState('all');

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'contract':
        return 'FileText';
      case 'payment':
        return 'DollarSign';
      case 'event':
        return 'Calendar';
      case 'dj':
        return 'Users';
      case 'system':
        return 'Bell';
      default:
        return 'Info';
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'text-error';
    if (priority === 'medium') return 'text-warning';
    
    switch (type) {
      case 'contract':
        return 'text-primary';
      case 'payment':
        return 'text-success';
      case 'event':
        return 'text-accent';
      case 'dj':
        return 'text-secondary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  const filteredNotifications = notifications?.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification?.read;
    return notification?.type === filter;
  });

  const unreadCount = notifications?.filter(n => !n?.read)?.length;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-foreground">
            Notificações
          </h2>
          {unreadCount > 0 && (
            <div className="w-6 h-6 bg-error rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-error-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            iconName="CheckCheck"
            iconPosition="left"
            onClick={onMarkAllAsRead}
          >
            Marcar Todas
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'unread', 'contract', 'payment', 'event', 'dj']?.map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
              filter === filterType
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {filterType === 'all' ? 'Todas' :
             filterType === 'unread' ? 'Não Lidas' :
             filterType === 'contract' ? 'Contratos' :
             filterType === 'payment' ? 'Pagamentos' :
             filterType === 'event' ? 'Eventos' : 'DJs'}
          </button>
        ))}
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredNotifications?.map((notification) => (
          <div
            key={notification?.id}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              notification?.read
                ? 'bg-muted/50 border-border' :'bg-card border-primary/20 shadow-sm'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                notification?.read ? 'bg-muted' : 'bg-primary/10'
              }`}>
                <Icon
                  name={getNotificationIcon(notification?.type)}
                  size={16}
                  className={getNotificationColor(notification?.type, notification?.priority)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      notification?.read ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      {notification?.title}
                    </p>
                    <p className={`text-xs mt-1 ${
                      notification?.read ? 'text-muted-foreground' : 'text-muted-foreground'
                    }`}>
                      {notification?.message}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(notification?.timestamp)}
                    </span>
                    {!notification?.read && (
                      <button
                        onClick={() => onMarkAsRead(notification?.id)}
                        className="w-2 h-2 bg-primary rounded-full hover:bg-primary/80 transition-colors duration-150"
                        title="Marcar como lida"
                      />
                    )}
                  </div>
                </div>
                {notification?.actionUrl && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="ExternalLink"
                      iconPosition="right"
                      onClick={() => window.location.href = notification?.actionUrl}
                    >
                      {notification?.actionText || 'Ver Detalhes'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredNotifications?.length === 0 && (
        <div className="text-center py-8">
          <Icon name="Bell" size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            Nenhuma Notificação
          </p>
          <p className="text-sm text-muted-foreground">
            {filter === 'unread' ?'Todas as notificações foram lidas.' :'Você não tem notificações no momento.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationFeed;