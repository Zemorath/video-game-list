import React from 'react';

const GameList = ({ games, removeGame }) => {
  return (
    <ul className="space-y-2 p-4">
      {games.map((game) => (
        <li key={game.guid} className="p-2 bg-gray-700 rounded-lg shadow">
          {game.name}
          <button
            onClick={() => removeGame(game.guid)}
            className="ml-4 p-1 bg-red-700 text-white rounded-lg hover:bg-red-600"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
};

export default GameList;