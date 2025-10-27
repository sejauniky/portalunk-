import React from 'react';
import Icon from '../../../components/AppIcon';
import { normalizeSocialUrl } from '../../../utils/social';

const SocialMediaCards = ({ dj }) => {
  const socialLinks = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'Instagram',
      url: normalizeSocialUrl('instagram', dj?.instagram),
      color: 'bg-gradient-to-r from-pink-500 to-purple-600',
      hoverColor: 'hover:from-pink-600 hover:to-purple-700'
    },
    {
      id: 'soundcloud',
      name: 'SoundCloud',
      icon: 'Music',
      url: normalizeSocialUrl('soundcloud', dj?.soundcloud),
      color: 'bg-gradient-to-r from-orange-500 to-red-500',
      hoverColor: 'hover:from-orange-600 hover:to-red-600'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: 'Play',
      url: normalizeSocialUrl('youtube', dj?.youtube),
      color: 'bg-gradient-to-r from-red-500 to-red-600',
      hoverColor: 'hover:from-red-600 hover:to-red-700'
    },
    {
      id: 'spotify',
      name: 'Spotify',
      icon: 'Music',
      url: normalizeSocialUrl('spotify', dj?.spotify),
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'Facebook',
      url: normalizeSocialUrl('facebook', dj?.facebook),
      color: 'bg-gradient-to-r from-blue-600 to-blue-700',
      hoverColor: 'hover:from-blue-700 hover:to-blue-800'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'Twitter',
      url: normalizeSocialUrl('twitter', dj?.twitter),
      color: 'bg-gradient-to-r from-blue-400 to-blue-500',
      hoverColor: 'hover:from-blue-500 hover:to-blue-600'
    }
  ];

  const availableLinks = socialLinks.filter(link => link.url);

  if (availableLinks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Redes Sociais</h4>
        <div className="text-center py-8">
          <Icon name="Share2" size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Nenhuma rede social cadastrada para este DJ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h4 className="text-lg font-semibold text-foreground mb-4">Redes Sociais</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${link.color} ${link.hoverColor} text-white rounded-lg p-4 flex items-center space-x-3 transition-all duration-200 hover:scale-105 hover:shadow-lg`}
          >
            <Icon name={link.icon} size={20} className="text-white" />
            <span className="font-medium">{link.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialMediaCards;
