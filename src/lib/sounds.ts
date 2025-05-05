export interface Sound {
  id: string;
  name: string;
  src: string;
}

// Sound file that's actually available
const GUITAR_SOUND = "/sounds/relaxing-guitar-loop-v5-245859.mp3";

// Collection of notification sounds
export const notificationSounds: Sound[] = [
  {
    id: "guitar",
    name: "Guitar",
    src: GUITAR_SOUND,
  },
  {
    id: "bell",
    name: "Bell",
    src: GUITAR_SOUND, // Fallback to the available sound
  },
  {
    id: "digital",
    name: "Digital",
    src: GUITAR_SOUND, // Fallback to the available sound
  },
];

// Collection of completion sounds
export const completionSounds: Sound[] = [
  {
    id: "guitar",
    name: "Guitar",
    src: GUITAR_SOUND,
  },
  {
    id: "success",
    name: "Success",
    src: GUITAR_SOUND, // Fallback to the available sound
  },
  {
    id: "fanfare",
    name: "Fanfare",
    src: GUITAR_SOUND, // Fallback to the available sound
  },
];

// Audio instances for playing sounds
const audioInstances: { [key: string]: HTMLAudioElement } = {};

export function playSound(src: string, volume: number = 1.0): void {
  if (typeof window === "undefined") return;

  try {
    // Create or reuse audio instance
    if (!audioInstances[src]) {
      const audio = new Audio(src);
      audio.preload = "auto"; // Preload the audio file

      // Add event listeners for troubleshooting
      audio.addEventListener("error", (e) => {
        console.error("Audio error:", e);
      });

      audioInstances[src] = audio;
    }

    const audio = audioInstances[src];
    audio.volume = volume;

    // If already playing, reset to start
    audio.currentTime = 0;

    // Play the sound - add user interaction check
    if (document.hasFocus()) {
      const playPromise = audio.play();

      // Handle play promise to avoid uncaught errors
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Limit playback to 5 seconds
            setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
            }, 5000);
          })
          .catch((error) => {
            console.error("Audio play failed:", error);

            // Try to play again with user interaction
            document.addEventListener(
              "click",
              function playOnClick() {
                audio
                  .play()
                  .then(() => {
                    // Limit playback to 5 seconds
                    setTimeout(() => {
                      audio.pause();
                      audio.currentTime = 0;
                    }, 5000);
                  })
                  .catch((e) => console.error("Retry play failed:", e));
                document.removeEventListener("click", playOnClick);
              },
              { once: true }
            );
          });
      }
    } else {
      console.warn("Document not focused, skipping sound playback");
    }
  } catch (error) {
    console.error("Error playing sound:", error);
  }
}

// Preload all the sounds
export function preloadSounds(): void {
  if (typeof window === "undefined") return;

  // Create a user interaction handler to enable audio
  const enableAudio = () => {
    const allSounds = [...notificationSounds, ...completionSounds];

    // Preload all sound files
    allSounds.forEach((sound) => {
      if (!audioInstances[sound.src]) {
        const audio = new Audio(sound.src);
        audio.preload = "auto";
        audio.load(); // Start loading

        // Mute and play a tiny bit to enable audio
        audio.volume = 0;
        audio
          .play()
          .then(() => {
            // Limit even test playback to 5 seconds
            setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
            }, 5000);
          })
          .catch(() => {
            // Silent catch - this is expected to fail sometimes
          })
          .finally(() => {
            // Reset volume after attempted play
            audio.volume = 1.0;
            audio.currentTime = 0;
          });

        audioInstances[sound.src] = audio;
      }
    });

    // Remove event listeners after first interaction
    document.removeEventListener("click", enableAudio);
    document.removeEventListener("keydown", enableAudio);
  };

  // Add event listeners for user interaction
  document.addEventListener("click", enableAudio);
  document.addEventListener("keydown", enableAudio);
}

// Function to initialize audio context with user interaction
export function initializeAudio(): void {
  if (typeof window === "undefined") return;

  // Use a simple audio context initialization
  try {
    // Create a temporary audio element to initialize audio system
    const tempAudio = new Audio(GUITAR_SOUND);
    tempAudio.volume = 0.1; // Low volume
    tempAudio
      .play()
      .then(() => {
        // Limit playback to 5 seconds
        setTimeout(() => {
          tempAudio.pause();
          tempAudio.currentTime = 0;
        }, 5000);
        console.log("Audio system initialized successfully");
      })
      .catch((error) => {
        console.warn("Audio initialization requires user interaction:", error);
      });

    // Also preload all configured sounds
    preloadSounds();
  } catch (error) {
    console.error("Error initializing audio:", error);
  }
}

export function formatTimeVerbose(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} seconds`;
  } else if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    return `${minutes} minute${
      minutes !== 1 ? "s" : ""
    } and ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
  }
}
