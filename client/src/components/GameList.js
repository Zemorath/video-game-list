import React from 'react';

const GameList = ({ games, removeGame }) => {
  return (
    <ul className="space-y-2">
      {games.map((game) => (
        <li key={game.guid} className="p-2 bg-white rounded shadow">
          {game.name}
          <button
            onClick={() => removeGame(game.guid)}
            className="ml-4 p-1 bg-red-500 text-white rounded"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
};

export default GameList;