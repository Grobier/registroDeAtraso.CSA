export const PAIN_ZONES = [
  'Cabeza',
  'Cara',
  'Cuello',
  'Estomago',
  'Genitales',
  'Espalda',
  'Brazo Izquierdo',
  'Brazo Derecho',
  'Pierna Izquierda',
  'Pierna Derecha',
  'Mano Izquierda',
  'Mano Derecha',
  'Pie Izquierdo',
  'Pie Derecho'
];

export const ACCIDENT_CAUSES = [
  { value: 'colision-accidental', label: 'Colisión accidental' },
  { value: 'caida', label: 'Caída' },
  { value: 'golpe', label: 'Golpe' },
  { value: 'herida-cortante', label: 'Herida cortante' },
  { value: 'discusion-golpes', label: 'Discusión a golpes con compañero' },
  { value: 'trayecto', label: 'Trayecto' }
];

export const PAIN_ZONE_LABELS = {
  Cabeza: 'la cabeza',
  Cara: 'el rostro',
  Cuello: 'el cuello',
  Estomago: 'el estómago',
  Genitales: 'la zona genital',
  Espalda: 'la espalda',
  'Brazo Izquierdo': 'el brazo izquierdo',
  'Brazo Derecho': 'el brazo derecho',
  'Pierna Izquierda': 'la pierna izquierda',
  'Pierna Derecha': 'la pierna derecha',
  'Mano Izquierda': 'la mano izquierda',
  'Mano Derecho': 'la mano derecha',
  'Mano Derecha': 'la mano derecha',
  'Pie Izquierdo': 'el pie izquierdo',
  'Pie Derecho': 'el pie derecho'
};

export const PAIN_LEVELS = [
  { value: 1, label: 'Sin dolor', face: '😀', color: '#159947' },
  { value: 2, label: 'Dolor leve', face: '🙂', color: '#67c21f' },
  { value: 4, label: 'Dolor moderado', face: '😐', color: '#f6c739' },
  { value: 6, label: 'Dolor fuerte', face: '😟', color: '#f18a00' },
  { value: 8, label: 'Dolor muy fuerte', face: '😢', color: '#dc5b17' },
  { value: 10, label: 'Dolor máximo', face: '😭', color: '#b8191f' }
];

export const createDefaultAttention = () => ({
  es_accidente: false,
  es_dolor: false,
  detalle_accidente: {
    tipo: '',
    trayecto_info: ''
  },
  detalle_dolor: {
    zonas: [],
    intensidad: 5
  },
  observaciones_libres: ''
});

export const formatAccidentLabel = (value) => {
  const match = ACCIDENT_CAUSES.find((item) => item.value === value);
  return match ? match.label : '';
};

export const formatNaturalList = (items) => {
  if (items.length === 0) {
    return '';
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} y ${items[1]}`;
  }
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
};
