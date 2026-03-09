import { useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameState } from './hooks/useGameState';
import { useSound } from './hooks/useSound';
import type { Character, Board, PlacedShip } from './types';
import HomeScreen from './components/HomeScreen';
import SelectCommander from './components/SelectCommander';
import CommanderSelected from './components/CommanderSelected';
import PlaceFleet from './components/PlaceFleet';
import Gameplay from './components/Gameplay';
import WinScreen from './components/WinScreen';
import LoseScreen from './components/LoseScreen';

function App() {
  const game = useGameState();
  const sound = useSound();

  const handleHomeStart = useCallback(() => {
    sound.playStart();
    game.setScreen('select');
  }, [sound, game]);

  const handleSelectCommander = useCallback(
    (player: Character, ai: Character) => {
      sound.playSelect();
      game.setPlayerCharacter(player);
      game.setAICharacter(ai);
      game.setScreen('place');
    },
    [sound, game]
  );

  const handleCommanderStart = useCallback(() => {
    sound.playStart();
    game.initGame();
    game.setScreen('gameplay');
  }, [sound, game]);

  const handleFleetReady = useCallback(
    (board: Board, placedShips: PlacedShip[]) => {
      sound.playStart();
      game.setPlayerBoard(board);
      game.setPlayerShips(placedShips);
      game.setScreen('commander');
    },
    [sound, game]
  );

  const handleWin = useCallback(() => {
    sound.playWin();
    game.setScreen('win');
  }, [sound, game]);

  const handleLose = useCallback(() => {
    sound.playLose();
    game.setScreen('lose');
  }, [sound, game]);

  const handlePlayAgain = useCallback(() => {
    game.resetGame();
  }, [game]);

  const handleAbandon = useCallback(() => {
    game.resetGame();
  }, [game]);

  return (
    <div className="w-full h-full">
      <AnimatePresence mode="wait">
        {game.screen === 'home' && (
          <HomeScreen key="home" onStart={handleHomeStart} />
        )}
        {game.screen === 'select' && (
          <SelectCommander key="select" onSelect={handleSelectCommander} onExit={handleAbandon} />
        )}
        {game.screen === 'place' && (
          <PlaceFleet key="place" onReady={handleFleetReady} onExit={handleAbandon} />
        )}
        {game.screen === 'commander' && game.playerCharacter && game.aiCharacter && (
          <CommanderSelected
            key="commander"
            player={game.playerCharacter}
            ai={game.aiCharacter}
            onStart={handleCommanderStart}
          />
        )}
        {game.screen === 'gameplay' && game.playerCharacter && game.aiCharacter && (
          <Gameplay
            key="gameplay"
            playerCharacter={game.playerCharacter}
            aiCharacter={game.aiCharacter}
            playerBoard={game.playerBoard}
            aiBoard={game.aiBoard}
            playerShips={game.playerShips}
            aiShips={game.aiShips}
            isPlayerTurn={game.isPlayerTurn}
            onPlayerFire={game.playerFire}
            onAIPeekTarget={game.aiPeekTarget}
            onAIFire={game.aiFireOnce}
            onEndPlayerTurn={() => game.setIsPlayerTurn(false)}
            onStartPlayerTurn={() => game.setIsPlayerTurn(true)}
            onWin={handleWin}
            onLose={handleLose}
            onExit={handleAbandon}
            playExplosion={sound.playExplosion}
            playSplash={sound.playSplash}
            playShipSunk={sound.playShipSunk}
            playClickSound={sound.playClickSound}
            playIncomingHit={sound.playIncomingHit}
          />
        )}
        {game.screen === 'win' && (
          <WinScreen key="win" onPlayAgain={handlePlayAgain} />
        )}
        {game.screen === 'lose' && (
          <LoseScreen key="lose" onPlayAgain={handlePlayAgain} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
