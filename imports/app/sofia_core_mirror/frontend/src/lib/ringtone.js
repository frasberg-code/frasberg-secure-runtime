// Ringtone and vibration utilities
let ringtone = null;

export function playRingtone() {
  if (!ringtone) {
    ringtone = new Audio('/sounds/ringtone.mp3');
    ringtone.loop = true;
  }
  
  ringtone.play().catch(err => {
    console.warn('Could not play ringtone:', err);
  });

  // Optional vibration for mobile devices
  if (navigator.vibrate) {
    navigator.vibrate([300, 150, 300, 150, 300, 150]);
  }
}

export function stopRingtone() {
  if (ringtone) {
    ringtone.pause();
    ringtone.currentTime = 0;
  }
  if (navigator.vibrate) {
    navigator.vibrate(0);
  }
}

// Notification sounds
let callEndSound = null;
let callStartSound = null;

export function playCallStartSound() {
  if (!callStartSound) {
    callStartSound = new Audio('/sounds/call-start.mp3');
  }
  callStartSound.play().catch(() => {});
}

export function playCallEndSound() {
  if (!callEndSound) {
    callEndSound = new Audio('/sounds/call-end.mp3');
  }
  callEndSound.play().catch(() => {});
}
