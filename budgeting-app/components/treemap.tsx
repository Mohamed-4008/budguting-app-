import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PetalCategory {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface PetalChartProps {
  categories: PetalCategory[];
  width?: number;
  height?: number;
}

const PetalChart: React.FC<PetalChartProps> = ({ 
  categories, 
  width = 400, 
  height = 400 
}) => {
  // Sort categories by value in descending order for better visualization
  const sortedCategories = [...categories].sort((a, b) => b.value - a.value);
  
  // Take top 5 categories and group the rest into "Other"
  const topCategories = sortedCategories.slice(0, 5);
  const otherCategories = sortedCategories.slice(5);
  
  // Calculate total value for the "Other" category
  const otherTotalValue = otherCategories.reduce((sum, category) => sum + category.value, 0);
  const totalValue = sortedCategories.reduce((sum, category) => sum + category.value, 0);
  const otherPercentage = totalValue > 0 ? (otherTotalValue / totalValue) * 100 : 0;
  
  // Create the "Other" category if there are remaining categories
  let processedCategories = [...topCategories];
  if (otherCategories.length > 0 && otherTotalValue > 0) {
    processedCategories.push({
      name: 'Other',
      value: otherTotalValue,
      percentage: otherPercentage,
      color: '#64748B' // A neutral color for "Other"
    });
  }
  
  // Calculate the center of the chart
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 30; // Leave some padding
  
  // Calculate angles for each petal
  const totalCategories = processedCategories.length;
  const anglePerCategory = (2 * Math.PI) / totalCategories;
  
  return (
    <View style={[styles.container, { width, height }]}>
      {/* Render each petal as a colored section */}
      {processedCategories.map((category, index) => {
        const startAngle = index * anglePerCategory - Math.PI / 2; // Start from top
        const endAngle = (index + 1) * anglePerCategory - Math.PI / 2;
        
        // Calculate radius based on percentage
        const radius = (category.percentage / 100) * maxRadius * 0.7 + maxRadius * 0.3;
        
        // Calculate position for text
        const textAngle = (startAngle + endAngle) / 2;
        const textRadius = radius * 0.7;
        const textX = centerX + textRadius * Math.cos(textAngle);
        const textY = centerY + textRadius * Math.sin(textAngle);
        
        return (
          <View key={index} style={styles.petalContainer}>
            {/* Petal shape - using multiple overlapping views to simulate a petal */}
            <View 
              style={[
                styles.petal,
                {
                  backgroundColor: category.color,
                  width: radius * 1.5,
                  height: radius,
                  left: centerX - (radius * 1.5) / 2,
                  top: centerY - radius / 2,
                  transform: [
                    { rotate: `${textAngle + Math.PI / 2}rad` }
                  ],
                  opacity: 0.9,
                }
              ]} 
            />
            
            {/* Category information */}
            <View 
              style={[
                styles.categoryInfo,
                {
                  left: textX - 60,
                  top: textY - 35,
                  minWidth: 120,
                }
              ]}
            >
              <Text style={styles.categoryName} numberOfLines={1}>
                {category.name}
              </Text>
              <Text style={styles.categoryPercentage}>
                {category.percentage.toFixed(1)}%
              </Text>
              <Text style={styles.categoryValue}>
                ${category.value.toFixed(0)}
              </Text>
            </View>
          </View>
        );
      })}
      
      {/* Center circle */}
      <View 
        style={[
          styles.centerCircle,
          {
            width: maxRadius * 0.4,
            height: maxRadius * 0.4,
            left: centerX - (maxRadius * 0.4) / 2,
            top: centerY - (maxRadius * 0.4) / 2,
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petalContainer: {
    position: 'absolute',
  },
  petal: {
    position: 'absolute',
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryInfo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 3,
  },
  categoryValue: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 3,
  },
  categoryPercentage: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  centerCircle: {
    position: 'absolute',
    backgroundColor: '#0F172A',
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#475569',
  },
});

export default PetalChart;