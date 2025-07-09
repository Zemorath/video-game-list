import React from 'react';

const Library = ({ games, removeGame }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-light text-text-primary mb-4">Your Game Library</h1>
        <p className="text-lg text-text-secondary font-light">
          {games.length} {games.length === 1 ? 'game' : 'games'} in your collection
        </p>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-card-bg rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="text-xl font-medium text-text-primary mb-2">No games yet</h3>
            <p className="text-text-secondary">Start building your library by searching for games above.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <div key={game.guid} className="bg-card-bg rounded-2xl overflow-hidden hover:bg-hover-gray transition-colors duration-200">
              {game.image && (
                <img 
                  src={game.image.medium_url} 
                  alt={game.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-medium text-text-primary mb-2 line-clamp-2">{game.name}</h3>
                <p className="text-text-secondary text-sm mb-3">{game.original_release_date}</p>
                <button
                  onClick={() => removeGame(game.guid)}
                  className="w-full py-2 bg-accent-gray hover:bg-hover-gray text-text-primary rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;