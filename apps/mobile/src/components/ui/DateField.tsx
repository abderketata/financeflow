// Champ date avec calendrier — équivalent mobile du sélecteur natif du web
// (`<input type="date">`) : affichage JJ/MM/AAAA, valeur AAAA-MM-JJ attendue
// par Strapi, semaine commençant le lundi, actions « Effacer » / « Aujourd'hui ».
//
// Calendrier écrit en JS pur : identique sur Android et en build web, sans
// module natif à ajouter (donc sans reconstruire l'APK).
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { brand, radius, spacing } from '@/theme/brand';

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const WEEKDAYS = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

/** Date locale → AAAA-MM-JJ (sans passer par l'UTC, qui décale d'un jour vers minuit). */
export const toISODate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getTodayISODate = () => toISODate(new Date());

const parseISODate = (value?: string | null) => {
  const match = value ? ISO_DATE_PATTERN.exec(value) : null;

  if (!match) {
    return null;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDisplay = (value?: string | null) => {
  const date = parseISODate(value);
  return date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : '';
};

/** 6 semaines complètes (42 jours) à partir du lundi précédant le 1er du mois. */
const buildMonthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  return Array.from({ length: 42 }, (_, index) => new Date(year, month, 1 - offset + index));
};

interface DateFieldProps {
  label: string;
  /** Date au format AAAA-MM-JJ, ou chaîne vide. */
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  helperText?: string;
  helperTextColor?: string;
  disabled?: boolean;
  /** Affiche « Effacer » dans le calendrier (champ facultatif). */
  clearable?: boolean;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'JJ/MM/AAAA',
  icon = 'calendar-outline',
  error,
  helperText,
  helperTextColor,
  disabled,
  clearable = true,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const display = formatDisplay(value);
  const accentColor = error ? brand.danger : open ? brand.blue600 : display ? brand.blue600 : brand.slate400;

  const select = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={disabled ? undefined : () => setOpen(true)}
        style={[
          styles.shell,
          open && styles.shellFocused,
          Boolean(error) && styles.shellError,
          disabled && styles.shellDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: Boolean(disabled) }}
      >
        <Ionicons name={icon} size={18} color={accentColor} />
        <Text style={[styles.shellText, Boolean(display) && styles.shellTextFilled]} numberOfLines={1}>
          {display || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={brand.slate500} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && helperText ? (
        <Text style={[styles.helper, helperTextColor ? { color: helperTextColor, fontWeight: '600' } : null]}>
          {helperText}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Le Pressable interne absorbe les touches pour ne pas fermer le calendrier. */}
          <Pressable style={styles.sheet} onPress={() => undefined}>
            {/* Monté seulement à l'ouverture : la Modal garde ses enfants entre deux
                ouvertures, le calendrier rouvrirait sinon sur la dernière vue utilisée. */}
            {open ? (
              <CalendarPanel
                title={label}
                value={value}
                clearable={clearable}
                onSelect={select}
                onClose={() => setOpen(false)}
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

interface CalendarPanelProps {
  title: string;
  value?: string | null;
  clearable: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function CalendarPanel({ title, value, clearable, onSelect, onClose }: CalendarPanelProps) {
  const selected = parseISODate(value);
  const today = new Date();
  const initial = selected ?? today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  // Vue « mois » affichée en premier : l'utilisateur choisit le mois (et
  // l'année avec les flèches), puis le jour dans la grille.
  const [pickingMonth, setPickingMonth] = useState(true);

  const days = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const selectedISO = selected ? toISODate(selected) : '';
  const todayISO = toISODate(today);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <View>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle} numberOfLines={1}>
          {title.replace(/\s*\*$/, '')}
        </Text>
        <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Fermer">
          <Ionicons name="close" size={18} color={brand.slate600} />
        </Pressable>
      </View>

      <View style={styles.nav}>
        <Pressable
          onPress={() => setPickingMonth((previous) => !previous)}
          style={styles.navTitle}
          accessibilityRole="button"
          accessibilityLabel="Choisir le mois et l'année"
        >
          <Text style={styles.navTitleText}>
            {pickingMonth ? viewYear : `${MONTHS[viewMonth]} ${viewYear}`}
          </Text>
          <Ionicons name={pickingMonth ? 'caret-up' : 'caret-down'} size={12} color={brand.navy900} />
        </Pressable>
        <View style={styles.navArrows}>
          <Pressable
            onPress={() => (pickingMonth ? setViewYear((year) => year - 1) : shiftMonth(-1))}
            style={styles.arrow}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={pickingMonth ? 'Année précédente' : 'Mois précédent'}
          >
            <Ionicons name="chevron-back" size={18} color={brand.slate700} />
          </Pressable>
          <Pressable
            onPress={() => (pickingMonth ? setViewYear((year) => year + 1) : shiftMonth(1))}
            style={styles.arrow}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={pickingMonth ? 'Année suivante' : 'Mois suivant'}
          >
            <Ionicons name="chevron-forward" size={18} color={brand.slate700} />
          </Pressable>
        </View>
      </View>

      {pickingMonth ? (
        <View style={styles.monthGrid}>
          {MONTHS_SHORT.map((name, index) => {
            const isCurrent = index === viewMonth;
            return (
              <Pressable
                key={name}
                style={[styles.monthCell, isCurrent && styles.daySelected]}
                onPress={() => {
                  setViewMonth(index);
                  setPickingMonth(false);
                }}
              >
                <Text style={[styles.monthText, isCurrent && styles.dayTextSelected]}>{name}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.dayGrid}>
            {days.map((day) => {
              const iso = toISODate(day);
              const inMonth = day.getMonth() === viewMonth;
              const isSelected = iso === selectedISO;
              const isToday = iso === todayISO;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <Pressable
                  key={iso}
                  style={styles.dayCell}
                  onPress={() => onSelect(iso)}
                  accessibilityRole="button"
                  accessibilityLabel={`${day.getDate()} ${MONTHS[day.getMonth()]} ${day.getFullYear()}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.day, isToday && styles.dayToday, isSelected && styles.daySelected]}>
                    <Text
                      style={[
                        styles.dayText,
                        isWeekend && styles.dayTextWeekend,
                        !inMonth && styles.dayTextMuted,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <View style={styles.footer}>
        {clearable ? (
          <Pressable onPress={() => onSelect('')} hitSlop={8} accessibilityRole="button">
            <Text style={styles.footerAction}>Effacer</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable onPress={() => onSelect(todayISO)} hitSlop={8} accessibilityRole="button">
          <Text style={styles.footerAction}>Aujourd'hui</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg - 2,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: brand.slate700,
    marginBottom: 6,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 2,
    backgroundColor: brand.white,
    borderWidth: 1.5,
    borderColor: brand.slate200,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg - 2,
    minHeight: 52,
  },
  shellFocused: {
    borderColor: brand.blue600,
  },
  shellError: {
    borderColor: brand.danger,
    backgroundColor: brand.dangerBg,
  },
  shellDisabled: {
    backgroundColor: brand.slate100,
  },
  shellText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: brand.slate400,
  },
  shellTextFilled: {
    color: brand.navy900,
  },
  error: {
    marginTop: 5,
    marginLeft: 3,
    fontSize: 11.5,
    fontWeight: '600',
    color: brand.danger,
  },
  helper: {
    marginTop: 5,
    marginLeft: 3,
    fontSize: 11.5,
    color: brand.slate500,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: brand.slate500,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.slate100,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  navTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: brand.navy900,
  },
  navArrows: {
    flexDirection: 'row',
    gap: 4,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: brand.slate500,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: '86%',
    height: '86%',
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: brand.slate500,
  },
  daySelected: {
    backgroundColor: brand.blue600,
    borderColor: brand.blue600,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.navy900,
  },
  dayTextWeekend: {
    color: brand.slate600,
  },
  dayTextMuted: {
    color: brand.slate400,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: brand.white,
    fontWeight: '800',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  monthCell: {
    width: '31%',
    paddingVertical: 14,
    borderRadius: radius.sm,
    alignItems: 'center',
    backgroundColor: brand.slate100,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.navy900,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: brand.slate200,
  },
  footerAction: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.blue600,
  },
});
