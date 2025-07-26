import { Midi } from "@tonejs/midi";

export interface MidiNote {
  pitch: number;
  time: number;
  duration: number;
  velocity: number;
}

export interface ProcessedMidiData {
  notes: MidiNote[];
  fileName: string;
  totalDuration: number;
}

export class MidiService {
  private cache = new Map<string, ProcessedMidiData>();
  private availableFiles: string[] = [
    "AfterDark.mid",
    "BoMoonlightN12.mid",
    "BoMoonlightTungstenFilament.mid",
    "DespacitoPiano.mid",
    "FawltyTowers.mid",
    "Flowers.mid",
    "HotelCalifornia.mid",
    "Hunter x Hunter 2011 - Departure!.mid",
    "IllBeGone.mid",
    "JamboreeMladenFranko&HisOrchestra.mid",
    "PinkPanther.mid",
    "Pirates of the Caribbean - He's a Pirate (1) (1).mid",
    "Super Mario 64 - Medley (1).mid",
    "Titantic.mid",
    "Tokyo Ghoul - Unravel.mid",
    "Under-The-Sea-(From-'The-Little-Mermaid')-1.mid",
  ];

  /**
   * Sélectionne un fichier MIDI aléatoire
   */
  public selectRandomMidiFile(): string {
    // Essayer d'utiliser le fichier pré-sélectionné pour le rendu
    const preselectedFile = this.getPreselectedMidiFile();
    if (preselectedFile && this.availableFiles.includes(preselectedFile)) {
      console.log(
        `[MidiService] Utilisation du fichier pré-sélectionné: ${preselectedFile}`,
      );
      return preselectedFile;
    }

    // Sinon, sélection aléatoire
    const randomIndex = Math.floor(Math.random() * this.availableFiles.length);
    const selectedFile = this.availableFiles[randomIndex];
    console.log(`[MidiService] Sélection aléatoire: ${selectedFile}`);
    return selectedFile;
  }

  /**
   * Obtient le fichier MIDI pré-sélectionné pour le rendu
   */
  private getPreselectedMidiFile(): string | null {
    try {
      // En environnement browser, essayer de charger le fichier de sélection via fetch
      if (typeof window !== "undefined") {
        // Pour le côté client, on ne peut pas lire directement les fichiers du système
        // On utilise la sélection aléatoire normale
        return null;
      }

      // Côté serveur uniquement (Node.js/SSR)
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require("fs");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require("path");

        const selectedMidiPath = path.join(
          process.cwd(),
          "public",
          "selected-midi.json",
        );

        if (!fs.existsSync(selectedMidiPath)) {
          return null;
        }

        const content = fs.readFileSync(selectedMidiPath, "utf8");
        const selectionInfo = JSON.parse(content);

        return selectionInfo.fileName || null;
      } catch {
        // Si fs n'est pas disponible (côté client), on ignore silencieusement
        return null;
      }
    } catch (error) {
      console.log(
        "[MidiService] Impossible de lire le fichier pré-sélectionné:",
        error,
      );
      return null;
    }
  }

  /**
   * Charge et parse un fichier MIDI
   */
  public async loadMidiFile(fileName: string): Promise<ProcessedMidiData> {
    // Vérifier le cache d'abord
    if (this.cache.has(fileName)) {
      console.log(`[MidiService] Fichier MIDI en cache: ${fileName}`);
      return this.cache.get(fileName)!;
    }

    try {
      console.log(`[MidiService] Chargement du fichier MIDI: ${fileName}`);

      // Charger le fichier MIDI depuis le dossier public
      let midiPath: string;
      let response: Response;

      if (typeof window !== "undefined") {
        // Côté client : utiliser fetch avec une URL relative
        midiPath = `/midis/${encodeURIComponent(fileName)}`;
        response = await fetch(midiPath);
      } else {
        // Côté serveur : lire directement le fichier
        const fs = require("fs");
        const path = require("path");

        const filePath = path.join(process.cwd(), "public", "midis", fileName);

        if (!fs.existsSync(filePath)) {
          throw new Error(`Fichier MIDI non trouvé: ${fileName}`);
        }

        const fileBuffer = fs.readFileSync(filePath);
        // Créer une Response-like object pour l'environnement Node.js
        response = {
          ok: true,
          status: 200,
          arrayBuffer: async () =>
            fileBuffer.buffer.slice(
              fileBuffer.byteOffset,
              fileBuffer.byteOffset + fileBuffer.byteLength,
            ),
        } as Response;
      }

      if (!response.ok) {
        throw new Error(
          `Erreur lors du chargement du fichier MIDI: ${response.status}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);

      console.log(
        `[MidiService] Fichier MIDI parsé: ${midi.tracks.length} pistes trouvées`,
      );

      // Extraire toutes les notes de toutes les pistes
      const allNotes: MidiNote[] = [];

      midi.tracks.forEach((track, trackIndex) => {
        console.log(
          `[MidiService] Piste ${trackIndex}: ${track.notes.length} notes`,
        );

        track.notes.forEach((note) => {
          allNotes.push({
            pitch: note.midi, // Numéro MIDI de la note (0-127)
            time: note.time, // Temps en secondes
            duration: note.duration, // Durée en secondes
            velocity: note.velocity, // Vélocité (0-1)
          });
        });
      });

      // Trier les notes par temps pour avoir une séquence ordonnée
      allNotes.sort((a, b) => a.time - b.time);

      console.log(
        `[MidiService] Total des notes extraites: ${allNotes.length}`,
      );

      const processedData: ProcessedMidiData = {
        notes: allNotes,
        fileName,
        totalDuration: midi.duration,
      };

      // Mettre en cache
      this.cache.set(fileName, processedData);

      return processedData;
    } catch (error) {
      console.error(
        `[MidiService] Erreur lors du chargement du fichier MIDI ${fileName}:`,
        error,
      );

      // Retourner un fallback avec quelques notes par défaut
      const fallbackData: ProcessedMidiData = {
        notes: [
          { pitch: 60, time: 0, duration: 0.5, velocity: 0.8 }, // Do central
          { pitch: 64, time: 0.5, duration: 0.5, velocity: 0.8 }, // Mi
          { pitch: 67, time: 1.0, duration: 0.5, velocity: 0.8 }, // Sol
          { pitch: 72, time: 1.5, duration: 0.5, velocity: 0.8 }, // Do aigu
        ],
        fileName: "fallback",
        totalDuration: 2.0,
      };

      return fallbackData;
    }
  }

  /**
   * Prétraite un fichier MIDI en JSON léger pour les performances
   */
  public async preprocessMidiToJson(fileName: string): Promise<string> {
    const midiData = await this.loadMidiFile(fileName);

    // Créer une version allégée pour de meilleures performances
    const lightweightData = {
      fileName: midiData.fileName,
      totalDuration: midiData.totalDuration,
      noteCount: midiData.notes.length,
      notes: midiData.notes.map((note) => ({
        p: note.pitch,
        t: Math.round(note.time * 1000) / 1000, // Arrondir à 3 décimales
        d: Math.round(note.duration * 1000) / 1000,
        v: Math.round(note.velocity * 100) / 100, // Arrondir à 2 décimales
      })),
    };

    return JSON.stringify(lightweightData);
  }

  /**
   * Vide le cache
   */
  public clearCache(): void {
    this.cache.clear();
    console.log("[MidiService] Cache vidé");
  }

  /**
   * Obtient la liste des fichiers MIDI disponibles
   */
  public getAvailableFiles(): string[] {
    return [...this.availableFiles];
  }

  /**
   * Convertit un numéro MIDI en fréquence Hz
   */
  public static midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  /**
   * Obtient le nom de la note à partir du numéro MIDI
   */
  public static midiToNoteName(midiNote: number): string {
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = noteNames[midiNote % 12];
    return `${note}${octave}`;
  }

  /**
   * Instance method pour obtenir le nom de la note (pour compatibilité)
   */
  public midiToNoteName(midiNote: number): string {
    return MidiService.midiToNoteName(midiNote);
  }
}

// Export de l'instance singleton
export const midiService = new MidiService();
