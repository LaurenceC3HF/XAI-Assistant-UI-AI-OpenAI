import React, { useRef, useState } from 'react';
import { VisualCard } from './VisualCard';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SHAPVisualProps {
  shapData?: Record<string, number>;
  onVisualizationHover?: (elementId: string, visualizationType: string) => () => void;
  onVisualizationClick?: (elementId: string, visualizationType: string) => void;
}

export const SHAPVisual: React.FC<SHAPVisualProps> = ({
  shapData,
  onVisualizationHover,
  onVisualizationClick
}) => {
  const cleanupFunctions = useRef<Record<string, (() => void) | null>>({});
  const [active, setActive] = useState<string | null>(null);

  if (!shapData) return null;

  // Meta information for features (group, description, why)
  const featureMeta: Record<string, { group: string; desc: string; why: string }> = {
    'Flight Deviation': {
      group: 'Flight Data',
      desc: 'Difference between expected and actual flight path.',
      why: 'High deviation is often observed during evasive manoeuvres.'
    },
    'Speed Increase': {
      group: 'Flight Data',
      desc: 'Current speed relative to filed flight plan.',
      why: 'Rapid acceleration may indicate intentional course change.'
    },
    'ATC Non-Response': {
      group: 'Communications',
      desc: 'Time since last radio contact with controllers.',
      why: 'Lack of response suggests potential hostile intent.'
    },
    'Geographic Vector': {
      group: 'Environmental',
      desc: 'Approach direction with respect to sensitive locations.',
      why: 'Certain approach vectors correlate with threat patterns.'
    },
    'Time of Day': {
      group: 'Environmental',
      desc: 'Local time during observation.',
      why: 'Events at night have historically higher risk.'
    }
  };

  // Sort features by absolute SHAP value
  const features = Object.entries(shapData).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));
  const maxAbsValue = Math.max(...features.map(([, v]) => Math.abs(v)));

  // Group features
  const grouped = features.reduce<Record<string, Array<[string, number]>>>((acc, cur) => {
    const group = featureMeta[cur[0]]?.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cur);
    return acc;
  }, {});

  // Advanced analytics/interaction hooks
  const handleMouseEnterFeature = (feature: string) => {
    setActive(feature);
    const cleanup = onVisualizationHover?.(feature, 'shap_feature');
    if (cleanup) {
      cleanupFunctions.current[feature] = cleanup;
    }
  };

  const handleMouseLeaveFeature = (feature: string) => {
    setActive(null);
    const cleanup = cleanupFunctions.current[feature];
    if (cleanup) {
      cleanup();
      cleanupFunctions.current[feature] = null;
    }
  };

  const handleFeatureClick = (feature: string) => {
    onVisualizationClick?.(feature, 'shap_feature');
  };

  return (
    <VisualCard>
      <div className="flex items-center mb-6">
        <TrendingUp className="w-6 h-6 text-teal-400 mr-3" />
        <h3 className="text-lg font-semibold text-teal-300">
          SHAP Feature Importance
        </h3>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([group, groupFeatures]) => (
          <div key={group} className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-400 border-b border-slate-600/50 pb-1 mb-1">
              {group}
            </h4>
            {groupFeatures.map(([feature, value]) => (
              <div
                key={feature}
                className="group cursor-pointer"
                onMouseEnter={() => handleMouseEnterFeature(feature)}
                onMouseLeave={() => handleMouseLeaveFeature(feature)}
                onClick={() => handleFeatureClick(feature)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                    {feature}
                  </span>
                  <div className="flex items-center">
                    {value > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                    )}
                    <span className={`text-sm font-bold ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {value.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="relative bg-slate-700/50 rounded-full h-3 overflow-hidden">
                  <div
                    style={{ width: `${(Math.abs(value) / maxAbsValue) * 100}%` }}
                    className={`
                      h-full transition-all duration-500 ease-out
                      ${value > 0
                        ? 'bg-gradient-to-r from-green-500 to-green-400'
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                      }
                    `}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {active && (
        <div className="mt-6 p-4 rounded-lg bg-slate-800/70 border border-slate-600/50 text-sm space-y-1">
          <p className="text-teal-300 font-semibold">{active}</p>
          <p className="text-gray-200">{featureMeta[active]?.desc}</p>
          <p className="text-gray-400 text-xs">{featureMeta[active]?.why}</p>
          <p className="text-gray-400 text-xs">Importance score: {shapData[active]?.toFixed(2)}</p>
        </div>
      )}
    </VisualCard>
  );
};
