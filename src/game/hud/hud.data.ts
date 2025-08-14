export type QuickActionKey =
  | 'startFocus' | 'startHypnosis' | 'voiceNote' | 'addNote'
  | 'openMap' | 'openBrowser' | 'openBrain';

export const character = {
  name: 'Dean',
  level: 7,
  job: 'Mind Wizard',
  hp: 78,   // %
  mp: 62,   // %
  xp: 34,   // %
  avatarColor: '#4fb0ff',
};

export const quickSlots: { id:number; key:string; action:QuickActionKey; label:string; icon?:string }[] = [
  { id:1, key:'1', action:'startFocus',    label:'Focus',   icon:'focus' },
  { id:2, key:'2', action:'startHypnosis', label:'Hypno',   icon:'hypno' },
  { id:3, key:'3', action:'voiceNote',     label:'Voice',   icon:'mic'   },
  { id:4, key:'4', action:'addNote',       label:'Notes',   icon:'note'  },
  { id:5, key:'5', action:'openBrowser',   label:'Browse',  icon:'portal'},
  { id:6, key:'6', action:'openBrain',     label:'Brain',   icon:'brain' },
];
