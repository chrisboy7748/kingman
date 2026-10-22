"""Piste provisoire 120 BPM calée sur index.html (15 s) : beat + basse + arpège hijaz + impacts.

Usage : python3 soundtrack.py sortie.wav
"""
import sys
import wave

import numpy as np

SR = 48000
DUR = 15.0
BEAT = 0.5
N = int(SR * DUR)
L = np.zeros(N)
Rch = np.zeros(N)
rng = np.random.default_rng(3)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * (1 - max(0, pan))
    Rch[i:i + len(sig)] += sig * (1 + min(0, pan))


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def kick():
    n = int(.35 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .12)


def noise(n):
    return rng.standard_normal(n)


def clap():
    n = int(.25 * SR); x = noise(n)
    x = np.diff(x, prepend=0)
    e = env(n, .001, .06)
    for d in (.0, .012, .024):
        e += np.roll(env(n, .001, .015), int(d * SR)) * .6
    return x * e * .35


def hat(open_=False):
    n = int((.18 if open_ else .05) * SR); x = np.diff(np.diff(noise(n), prepend=0), prepend=0)
    return x * env(n, .0005, .06 if open_ else .012) * .12


def tone(freq, length, harmonics=(1, .5, .33, .25), decay=.4, attack=.003):
    n = int(length * SR); t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * freq * (k + 1) * t) * np.exp(-t * k * 3) for k, a in enumerate(harmonics))
    return s * env(n, attack, decay)


def impact():
    n = int(1.6 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-t * 9)) / SR) * np.exp(-t * 2.5)
    crash = np.diff(noise(n), prepend=0) * np.exp(-t * 3.2) * .25
    return boom + crash


def riser(length):
    n = int(length * SR); t = np.arange(n) / SR
    x = np.diff(noise(n), prepend=0)
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 1800 * (t / length) ** 2) / SR)
    return (x * .25 + sweep * .15) * (t / length) ** 2


def whoosh():
    n = int(.3 * SR); t = np.arange(n) / SR
    return np.diff(noise(n), prepend=0) * np.sin(np.pi * t / .3) ** 2 * .3


# Hijaz sur ré
D3, Eb3, Fs3, G3, A3, Bb3, C4, D4 = 146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66
HIJAZ = [D4, D4 * Eb3 / D3, D4 * Fs3 / D3, D4 * G3 / D3, D4 * A3 / D3, D4 * Bb3 / D3, D4 * C4 / D3, D4 * 2]
BASS = [73.42, 73.42, 77.78, 73.42, 65.41, 73.42, 58.27, 73.42]  # une note par mesure de 2 s

# Accroche (0–2 s) : un coup + un accord sur chaque mot, montée vers la chute
for b in range(4):
    add(kick(), b * BEAT, .9)
    for f in (D4 / 2, Fs3, A3):
        add(tone(f, .45, decay=.18), b * BEAT, .18)
add(riser(1.0), 1.0, .6)

# Chute à 2 s : rythme complet
for b in range(4, 30):
    t = b * BEAT
    add(kick(), t, 1.0)
    if b % 2:
        add(clap(), t, 1.0)
    add(hat(), t + BEAT / 2, 1.0, .3)
    if b >= 8:
        add(hat(), t + BEAT / 4, .6, -.3)
        add(hat(), t + 3 * BEAT / 4, .6, .3)
    if b % 4 == 3:
        add(hat(True), t + BEAT / 2, .8)

# Basse en croches
for b in range(4, 30):
    f = BASS[(b // 4) % len(BASS)]
    for k, mult in enumerate((1, 2)):
        add(tone(f * mult, .24, harmonics=(1, .6, .3), decay=.12), b * BEAT + k * BEAT / 2, .35)

# Arpège hijaz en doubles croches
PATTERN = [0, 2, 4, 2, 1, 2, 4, 5, 7, 5, 4, 2, 3, 2, 1, 0]
for b in range(4, 30):
    if 17 <= b <= 19:  # respiration avant FLORAL / FRUITÉ / MUSQUÉ
        continue
    for k in range(4):
        n = PATTERN[(b * 4 + k) % len(PATTERN)]
        add(tone(HIJAZ[n], .2, harmonics=(1, .4, .2, .1), decay=.09), b * BEAT + k * BEAT / 4, .16, (-1) ** k * .4)

# Ponctuations
add(impact(), 2.25, .8)
for t in (4.0, 5.5, 7.0):
    add(whoosh(), t - .15, .8)
for t in (8.5, 9.0, 9.5):
    add(impact()[: int(.4 * SR)], t, .45)
add(impact(), 10.0, .6)
add(riser(1.0), 10.5, .5)
add(impact(), 11.5, .8)
for t in (13.0, 14.0):
    add(tone(2400, .06, harmonics=(1,), decay=.01), t, .4)

mix = np.stack([L, Rch], axis=1)
fade = np.ones(N); fade[-int(.3 * SR):] = np.linspace(1, 0, int(.3 * SR))
mix *= fade[:, None]
mix = np.tanh(mix * 1.2)
mix /= np.abs(mix).max() / .9

with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
