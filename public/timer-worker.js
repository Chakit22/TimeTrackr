// Web Worker for background timer processing
let timerId = null;
let timeLeft = 0;
let duration = 0;
let recurrentTime = 0;
let lastNotificationTime = 0;

self.onmessage = function (e) {
  const { action, data } = e.data;

  switch (action) {
    case "start":
      duration = data.duration;
      timeLeft = data.timeLeft;
      recurrentTime = data.recurrentTime;
      startTimer();
      break;
    case "pause":
      pauseTimer();
      break;
    case "reset":
      resetTimer(data.duration);
      break;
    case "update":
      duration = data.duration;
      recurrentTime = data.recurrentTime;
      if (data.timeLeft !== undefined) {
        timeLeft = data.timeLeft;
      }
      break;
  }
};

function startTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
  }

  timerId = setInterval(() => {
    timeLeft--;

    // Check for recurrent notification
    const elapsed = duration - timeLeft;
    if (
      recurrentTime > 0 &&
      elapsed > 0 &&
      elapsed % recurrentTime < 1 &&
      Date.now() - lastNotificationTime > 5000
    ) {
      lastNotificationTime = Date.now();
      self.postMessage({
        type: "notification",
        data: {
          type: "recurrent",
          elapsed,
        },
      });
    }

    // Check for final minute notification
    if (timeLeft === 60) {
      self.postMessage({
        type: "notification",
        data: {
          type: "finalMinute",
        },
      });
    }

    // Update UI with current time
    self.postMessage({
      type: "tick",
      data: { timeLeft },
    });

    // Check for timer completion
    if (timeLeft <= 0) {
      clearInterval(timerId);
      timerId = null;
      self.postMessage({
        type: "complete",
      });
    }
  }, 1000);
}

function pauseTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function resetTimer(newDuration) {
  pauseTimer();
  timeLeft = newDuration || duration;
  lastNotificationTime = 0;
  self.postMessage({
    type: "reset",
    data: { timeLeft },
  });
}
