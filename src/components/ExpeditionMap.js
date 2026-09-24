import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Animated, Easing, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Day images for completed and non-completed states
const DAY_IMAGES = {
    monday: {
        completed: require('../../assets/images/days/monday.png'),
        notCompleted: require('../../assets/images/days/monday_nc.png'),
    },
    tuesday: {
        completed: require('../../assets/images/days/tuesday.png'),
        notCompleted: require('../../assets/images/days/tuesday_nc.png'),
    },
    wednesday: {
        completed: require('../../assets/images/days/wednesday.png'),
        notCompleted: require('../../assets/images/days/wednesday_nc.png'),
    },
    thursday: {
        completed: require('../../assets/images/days/thursday.png'),
        notCompleted: require('../../assets/images/days/thursday_nc.png'),
    },
    friday: {
        completed: require('../../assets/images/days/friday.png'),
        notCompleted: require('../../assets/images/days/friday_nc.png'),
    },
    saturday: {
        completed: require('../../assets/images/days/saturday.png'),
        notCompleted: require('../../assets/images/days/saturday_nc.png'),
    },
    sunday: {
        completed: require('../../assets/images/days/sunday.png'),
        notCompleted: require('../../assets/images/days/sunday_nc.png'),
    },
};

// Default nodes representing days Mon-Sun (1-7)
const DEFAULT_NODES = [
    { id: 1, label: 'Monday', dayKey: 'monday', x: 0.2, y: 0.1 },
    { id: 2, label: 'Tuesday', dayKey: 'tuesday', x: 0.5, y: 0.2 },
    { id: 3, label: 'Wednesday', dayKey: 'wednesday', x: 0.8, y: 0.3 },
    { id: 4, label: 'Thursday', dayKey: 'thursday', x: 0.5, y: 0.45 },
    { id: 5, label: 'Friday', dayKey: 'friday', x: 0.2, y: 0.6 },
    { id: 6, label: 'Saturday', dayKey: 'saturday', x: 0.5, y: 0.75 },
    { id: 7, label: 'Sunday', dayKey: 'sunday', x: 0.8, y: 0.9, isChest: true },
];

// Map node IDs to day keys for backend nodes that don't have dayKey
const ID_TO_DAY_KEY = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday',
};

const ExpeditionMap = ({ currentDay, onNodePress, isCompleted, completedDays = [], unlockedDays = [], nodes: propNodes }) => {
    const { width } = useWindowDimensions();

    // Use prop nodes if provided, otherwise fallback to defaults
    // Enrich nodes with dayKey if missing (for backend nodes)
    const nodes = useMemo(() => {
        const sourceNodes = (propNodes && Array.isArray(propNodes) && propNodes.length > 0)
            ? propNodes
            : DEFAULT_NODES;

        // Ensure all nodes have dayKey for image rendering
        return sourceNodes.map(node => ({
            ...node,
            dayKey: node.dayKey || ID_TO_DAY_KEY[node.id] || null,
        }));
    }, [propNodes]);

    // Animation for the active node
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Helper for Cubic Bezier Curve
    const getBezierPoint = (t, p0, p1, p2, p3) => {
        const cX = 3 * (p1.x - p0.x);
        const bX = 3 * (p2.x - p1.x) - cX;
        const aX = p3.x - p0.x - cX - bX;

        const cY = 3 * (p1.y - p0.y);
        const bY = 3 * (p2.y - p1.y) - cY;
        const aY = p3.y - p0.y - cY - bY;

        const x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
        const y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

        return { x, y };
    };

    // Animation for path filling
    const pathProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate path filling when screen loads or completion updates
        Animated.timing(pathProgress, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true, // Opacity/Scale only
        }).start();
    }, [completedDays]);

    // Render path dots between nodes
    const renderPath = () => {
        const segments = [];

        for (let i = 0; i < nodes.length - 1; i++) {
            const startNode = nodes[i];
            const endNode = nodes[i + 1];

            // Determine if this segment is completed (start node is completed)
            const isSegmentCompleted = completedDays?.includes(startNode.id);

            // Coordinates - Centered on screen and aligned with image nodes
            // width - 80 means 80px total horizontal padding
            // + 40 centers it (40px left, 40px right)
            // Y offset: node top + half of image container height (56/2 = 28)
            const p0 = { x: startNode.x * (width - 80) + 40, y: startNode.y * 500 + 28 };
            const p3 = { x: endNode.x * (width - 80) + 40, y: endNode.y * 500 + 28 };

            // Control Points for S-Curve
            // We want the curve to leave p0 vertically and arrive at p3 vertically for smooth transitions
            // Increased offset for "sharper" curves as requested
            const p1 = { x: p0.x, y: p0.y + 100 }; // Control point 1: Down from start
            const p2 = { x: p3.x, y: p3.y - 100 }; // Control point 2: Up from end

            const distance = Math.sqrt(Math.pow(p3.x - p0.x, 2) + Math.pow(p3.y - p0.y, 2));
            const dotCount = Math.floor(distance / 8); // Denser dots for smoother curve

            const segmentDots = [];
            for (let j = 0; j <= dotCount; j++) {
                const t = j / dotCount;
                const point = getBezierPoint(t, p0, p1, p2, p3);

                // For animation: We can use opacity interpolation if we want the path to "draw" itself
                // But for now, let's just animate the completed segments appearing

                segmentDots.push(
                    <Animated.View
                        key={`path-${i}-${j}`}
                        style={[
                            styles.pathDot,
                            {
                                left: point.x,
                                top: point.y,
                                backgroundColor: isSegmentCompleted ? '#10B981' : 'rgba(255,255,255,0.2)',
                                width: isSegmentCompleted ? 6 : 4,
                                height: isSegmentCompleted ? 6 : 4,
                                borderRadius: isSegmentCompleted ? 3 : 2,
                                opacity: isSegmentCompleted ? pathProgress : 1, // Fade in green dots
                                transform: isSegmentCompleted ? [{ scale: pathProgress }] : [], // Scale up green dots
                            }
                        ]}
                    />
                );
            }
            segments.push(segmentDots);
        }
        return segments;
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.mapContainer}>
                {/* Background Path Dots */}
                {renderPath()}

                {nodes.map((node, index) => {
                    const isNodeCompleted = completedDays?.includes(node.id);
                    const isUnlocked = unlockedDays?.includes(node.id);
                    // Show as active if it's current day OR if it's unlocked (purchased) and not completed
                    const isActive = (node.id === currentDay || isUnlocked) && !isNodeCompleted;
                    const isPast = node.id < currentDay || isNodeCompleted; // Keep past logic but prioritize completion
                    const isLocked = node.id > currentDay && !isUnlocked;

                    // Get the appropriate image for this day
                    const dayImages = node.dayKey ? DAY_IMAGES[node.dayKey] : null;
                    const nodeImage = dayImages
                        ? (isNodeCompleted ? dayImages.completed : dayImages.notCompleted)
                        : null;

                    return (
                        <View
                            key={node.id}
                            style={[
                                styles.nodeWrapper,
                                {
                                    // Center 120px wrapper on point (x*(w-80)+40)
                                    // Left = Center - 60
                                    // Left = x*(w-80) + 40 - 60 = x*(w-80) - 20
                                    left: node.x * (width - 80) - 20,
                                    top: node.y * 500, // Arbitrary height scale
                                }
                            ]}
                        >
                            {/* Allow tapping on: active day, completed days, or skipped (past non-completed) days */}
                            {/* Only lock future days */}
                            <TouchableOpacity
                                onPress={() => onNodePress(node.id)}
                                disabled={isLocked}
                                activeOpacity={0.8}
                                style={{ alignItems: 'center' }}
                            >
                                <Animated.View
                                    style={[
                                        styles.nodeImageContainer,
                                        isActive && { transform: [{ scale: pulseAnim }] },
                                        isActive && styles.activeNodeGlow,
                                    ]}
                                >
                                    {nodeImage ? (
                                        <Image
                                            source={nodeImage}
                                            style={styles.dayImage}
                                            resizeMode="contain"
                                        />
                                    ) : node.isChest ? (
                                        // Fallback for chest node if no image
                                        <View style={[styles.node, styles.chestNode]}>
                                            <Icon name={isCompleted ? "gift-outline" : "gift"} size={24} color="#FFF" />
                                        </View>
                                    ) : (
                                        // Fallback for nodes without images
                                        <View style={[
                                            styles.node,
                                            isNodeCompleted && styles.completedNode,
                                            isLocked && styles.lockedNode,
                                        ]}>
                                            <Text style={styles.nodeText}>
                                                {isNodeCompleted ? <Icon name="checkmark" size={16} color="#FFF" /> : node.id}
                                            </Text>
                                        </View>
                                    )}
                                </Animated.View>
                                {/* Day labels removed as requested */}
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 0,
        alignItems: 'center',
        paddingBottom: 100,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 30,
    },
    mapContainer: {
        width: '100%',
        height: 600, // Fixed height for the map area
        position: 'relative',
        marginTop: -20, // Shift map up
    },
    // pathLine removed
    pathDot: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    nodeWrapper: {
        position: 'absolute',
        alignItems: 'center',
        width: 120, // Much wider to ensure image centers perfectly
        // No margin left needed as we handle centering in 'left' prop
    },
    nodeImageContainer: {
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayImage: {
        width: 50,
        height: 50,
        borderRadius: 6,
    },
    activeNodeGlow: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 10,
    },
    node: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#374151', // Default locked
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    activeNode: {
        backgroundColor: '#F59E0B', // Amber for active
        borderColor: '#FFF',
        shadowColor: '#F59E0B',
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 10,
    },
    completedNode: {
        backgroundColor: '#10B981', // Green for completed
        borderColor: '#059669',
    },
    lockedNode: {
        backgroundColor: '#4B5563', // Grey for locked
    },
    chestNode: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EF4444', // Red for chest
        borderColor: '#FFD700',
        borderWidth: 3,
    },
    nodeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    nodeLabel: {
        color: '#FFF',
        marginTop: 6,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
        textAlign: 'center',
        // Game-like pill background
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        overflow: 'hidden',
        // Enhanced text shadow
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
});

export default ExpeditionMap;
