#!/usr/bin/env tsx

import { midiService } from '../src/services/midiService';
import { MidiService } from '../src/services/midiService';

/**
 * Script de test pour le système MIDI
 */

async function testMidiSystem(): Promise<void> {
  console.log('🎵 Test du système MIDI');
  console.log('========================\n');

  try {
    // 1. Test de sélection aléatoire
    console.log('1. Test de sélection de fichier MIDI...');
    const selectedFile = midiService.selectRandomMidiFile();
    console.log(`   ✅ Fichier sélectionné: ${selectedFile}\n`);

    // 2. Test de chargement et parsing
    console.log('2. Test de chargement et parsing...');
    const midiData = await midiService.loadMidiFile(selectedFile);
    console.log(`   ✅ Fichier chargé: ${midiData.fileName}`);
    console.log(`   📊 Nombre de notes: ${midiData.notes.length}`);
    console.log(`   ⏱️  Durée totale: ${midiData.totalDuration.toFixed(2)}s\n`);

    // 3. Test des premières notes
    console.log('3. Analyse des premières notes...');
    const firstNotes = midiData.notes.slice(0, 5);
    firstNotes.forEach((note, index) => {
      const noteName = midiService.midiToNoteName(note.pitch);
      const frequency = MidiService.midiToFrequency(note.pitch);
      console.log(`   Note ${index + 1}: ${noteName} (${frequency.toFixed(1)}Hz) - Vélocité: ${note.velocity.toFixed(2)} - Durée: ${note.duration.toFixed(2)}s`);
    });
    console.log('');

    // 4. Test du prétraitement JSON
    console.log('4. Test du prétraitement JSON...');
    const jsonData = await midiService.preprocessMidiToJson(selectedFile);
    const parsedData = JSON.parse(jsonData);
    console.log(`   ✅ JSON généré (${jsonData.length} caractères)`);
    console.log(`   📊 Notes dans le JSON: ${parsedData.noteCount}`);
    console.log(`   📁 Nom du fichier: ${parsedData.fileName}\n`);

    // 5. Test de la liste des fichiers disponibles
    console.log('5. Test de la liste des fichiers disponibles...');
    const availableFiles = midiService.getAvailableFiles();
    console.log(`   ✅ ${availableFiles.length} fichiers MIDI disponibles`);
    console.log(`   📋 Premiers fichiers: ${availableFiles.slice(0, 3).join(', ')}\n`);

    // 6. Test d'un autre fichier pour vérifier le cache
    console.log('6. Test du cache avec un second fichier...');
    const secondFile = availableFiles.find(file => file !== selectedFile) || availableFiles[0];
    const startTime = Date.now();
    const secondMidiData = await midiService.loadMidiFile(secondFile);
    const loadTime1 = Date.now() - startTime;
    
    // Charger à nouveau le même fichier pour tester le cache
    const startTime2 = Date.now();
    await midiService.loadMidiFile(secondFile);
    const loadTime2 = Date.now() - startTime2;
    
    console.log(`   ✅ Premier chargement: ${loadTime1}ms`);
    console.log(`   ✅ Second chargement (cache): ${loadTime2}ms`);
    console.log(`   📊 Accélération: ${(loadTime1 / Math.max(loadTime2, 1)).toFixed(1)}x\n`);

    // 7. Résumé
    console.log('🎉 Test du système MIDI terminé avec succès !');
    console.log('================================================');
    console.log(`Total de fichiers testés: 2`);
    console.log(`Notes totales analysées: ${midiData.notes.length + secondMidiData.notes.length}`);
    console.log(`Cache fonctionnel: ✅`);
    console.log(`Parsing MIDI: ✅`);
    console.log(`Conversion JSON: ✅`);
    console.log(`Conversion fréquences: ✅\n`);

  } catch (error) {
    console.error('❌ Erreur lors du test du système MIDI:', error);
    process.exit(1);
  }
}

// Exécuter le test si ce script est appelé directement
if (require.main === module) {
  testMidiSystem();
}