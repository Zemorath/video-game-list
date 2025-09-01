import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark-primary border-t border-dark-secondary mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Game Library</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Your personal gaming companion. Discover, organize, and track your gaming journey with our comprehensive library management system.
            </p>
          </div>

          {/* Features Section */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Features</h3>
            <ul className="space-y-2 text-text-secondary text-sm">
              <li>• Personal game library management</li>
              <li>• Daily gaming reviews</li>
              <li>• Social features and user discovery</li>
              <li>• Game sharing and statistics</li>
            </ul>
          </div>

          {/* Contact/Links Section */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Connect</h3>
            <div className="space-y-2 text-text-secondary text-sm">
              <p>Built for gamers, by gamers</p>
              <p>Powered by RAWG API, Giant Bomb API & YouTube</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dark-secondary pt-6">
          {/* Cookie & Privacy Notice */}
          <div className="bg-dark-secondary rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="text-text-primary font-medium text-sm mb-2">Privacy & Cookies</h4>
                <p className="text-text-secondary text-xs leading-relaxed">
                  This website uses cookies solely for authentication and session management purposes. 
                  We do not track your browsing activity, sell your data, or use cookies for advertising. 
                  Your game library and profile information are stored securely and are only visible to you and users you choose to share with.
                </p>
              </div>
            </div>
          </div>

          {/* Copyright and Legal */}
          <div className="flex flex-col md:flex-row justify-between items-center text-text-secondary text-xs">
            <div className="mb-4 md:mb-0">
              <p>&copy; 2025 Game Library. Built with ❤️ for the gaming community.</p>
            </div>
            <div className="flex space-x-4">
              <span>Secure • Private • Ad-Free</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
