import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const StreakDetailsModal = ({ visible, onClose, streak, userProfile }) => {
  // Mock logic for "active days" - in a real app, pass this data in
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // Mon=0, Sun=6

  // Wager Logic
  const activeWager = userProfile?.activeWager;
  let wagerDaysRemaining = 0;
  let wagerProgress = 0;
  const WAGER_DURATION_DAYS = 7;

  if (activeWager && activeWager.status === 'active') {
    const startDate = activeWager.startDate?.toDate ? activeWager.startDate.toDate() : new Date(activeWager.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + WAGER_DURATION_DAYS);
    const now = new Date();
    wagerDaysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    wagerProgress = WAGER_DURATION_DAYS - wagerDaysRemaining;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#FFF0F5']} // White to very light pink/orange
            style={styles.contentCard}
          >
            {/* Header / Close */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Main Icon Animation */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#FF9966', '#FF5E62']}
                style={styles.iconBackground}
              >
                <Icon name="fire" size={40} color="#FFF" />
              </LinearGradient>
            </View>

            {/* Title & Stats */}
            <Text style={styles.title}>Streak Active!</Text>
            <Text style={styles.subtitle}>
              You're on a <Text style={styles.highlight}>{streak}-day</Text> roll.
            </Text>
            <Text style={styles.description}>
              Keep learning every day to protect your streak and earn bonus gems!
            </Text>

            {/* Mini Calendar Visual */}
            <View style={styles.calendarContainer}>
              {weekDays.map((day, index) => {
                // Calculate if this day is part of the current streak
                // Logic: Day is active if it's today or within the streak window looking back
                const isToday = index === todayIndex;
                const daysBack = todayIndex - index; // 0 for today, 1 for yesterday, etc.
                const isPartOfStreak = daysBack >= 0 && daysBack < streak;

                return (
                  <View key={index} style={styles.dayColumn}>
                    <View style={[
                      styles.dayCircle,
                      isPartOfStreak ? styles.dayActive : styles.dayInactive,
                      isToday && styles.dayToday
                    ]}>
                      {isPartOfStreak && (
                        <Icon name="check" size={12} color="#FFF" />
                      )}
                    </View>
                    <Text style={[styles.dayText, isToday && styles.dayTextActive]}>{day}</Text>
                  </View>
                );
              })}
            </View>

            {/* ACTIVE WAGER SECTION */}
            {activeWager && activeWager.status === 'active' && (
              <View style={styles.wagerContainer}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.wagerCard}
                >
                  <View style={styles.wagerHeader}>
                    <Icon name="diamond-stone" size={20} color="#FFD700" />
                    <Text style={styles.wagerTitle}>Double or Nothing Active!</Text>
                  </View>

                  <Text style={styles.wagerText}>
                    {wagerDaysRemaining} days left to win <Text style={{ fontWeight: 'bold', color: '#FFD700' }}>{activeWager.reward || activeWager.amount * 2} Gems</Text>!
                  </Text>

                  <View style={styles.wagerProgress}>
                    {[...Array(WAGER_DURATION_DAYS)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.wagerDot,
                          i < wagerProgress ? styles.wagerDotComplete : styles.wagerDotPending
                        ]}
                      />
                    ))}
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity style={styles.actionButton} onPress={onClose}>
              <LinearGradient
                colors={['#FF9966', '#FF5E62']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>LET'S GO!</Text>
              </LinearGradient>
            </TouchableOpacity>

          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  contentCard: {
    padding: 25,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  iconContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF5E62",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  highlight: {
    color: '#FF5E62',
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  // Calendar Styles
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayActive: {
    backgroundColor: '#10B981', // Green for completed
  },
  dayInactive: {
    backgroundColor: '#E5E7EB',
  },
  dayToday: {
    borderWidth: 2,
    borderColor: '#FF5E62',
    backgroundColor: '#10B981',
    transform: [{ scale: 1.1 }]
  },
  dayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  dayTextActive: {
    color: '#FF5E62',
  },

  // Wager Styles
  wagerContainer: {
    width: '100%',
    marginBottom: 25,
  },
  wagerCard: {
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  wagerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  wagerTitle: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },
  wagerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  wagerProgress: {
    flexDirection: 'row',
    gap: 6,
  },
  wagerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  wagerDotComplete: {
    backgroundColor: '#FFF',
  },
  wagerDotPending: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  // Button
  actionButton: {
    width: '100%',
    shadowColor: "#FF5E62",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default StreakDetailsModal;