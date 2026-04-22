// Premium Notification Arpeggio (Loud & Melodic)
let audioCtx = null;
let lastPlayed = 0;
const THROTTLE_MS = 1500;

export const initAudio = async () => {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
        console.log('🔊 Audio Engine Woken Up:', audioCtx.state);
        return true;
    } catch (e) {
        console.error('Failed to wake audio:', e);
        return false;
    }
};

/**
 * Plays a loud, professional 4-note rising arpeggio.
 */
export const playNotificationSound = async (forced = false) => {
    const now = Date.now();
    if (!forced && now - lastPlayed < THROTTLE_MS) return;

    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') await audioCtx.resume();

        const t = audioCtx.currentTime;
        const notes = [
            { freq: 523.25, start: 0, duration: 0.15 }, // C5
            { freq: 659.25, start: 0.08, duration: 0.15 }, // E5
            { freq: 783.99, start: 0.16, duration: 0.15 }, // G5
            { freq: 1046.50, start: 0.24, duration: 0.40 } // C6 (Longer finish)
        ];

        notes.forEach(note => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(note.freq, t + note.start);

            // High Volume Envelope
            gainNode.gain.setValueAtTime(0, t + note.start);
            gainNode.gain.linearRampToValueAtTime(0.6, t + note.start + 0.02); // 60% peak
            gainNode.gain.exponentialRampToValueAtTime(0.01, t + note.start + note.duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start(t + note.start);
            oscillator.stop(t + note.start + note.duration);
        });

        lastPlayed = now;
        console.log('🎵 Premium Arpeggio Played');
    } catch (error) {
        console.error('❌ Failed to play premium ringtone:', error);
    }
};
