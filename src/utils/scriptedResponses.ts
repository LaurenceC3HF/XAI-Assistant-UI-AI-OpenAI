import { XAIExplanation } from '../types';
import { xaiExplanation } from '../data/scenarios';
import { analyzeQueryForTab, getQueryContext } from './queryAnalyzer';

// Enhanced response templates with context-specific content
const responseTemplates: Record<string, Partial<XAIExplanation>> = {
  'flight_deviation': {
    response: "Flight deviation analysis: Aircraft has deviated 45° from original flight plan without ATC clearance.",
    insight: {
      text: "Flight deviation indicators:\n• Original heading: 270° (West)\n• Current heading: 315° (Northwest)\n• Deviation initiated 12 minutes ago\n• No response to ATC communications\n• Speed increased from 120 to 180 knots",
      lime: ["heading_change", "timing", "communication_loss", "speed_increase"]
    },
    reasoning: {
      text: "Deviation analysis shows deliberate course change:\n• Deviation angle suggests intentional navigation\n• Speed increase indicates urgency or evasion\n• Timing coincides with shift change vulnerabilities\n• Flight path now aligns with critical infrastructure",
      dag: {
        nodes: [
          { id: 'deviation', label: 'Course Deviation' },
          { id: 'speed', label: 'Speed Change' },
          { id: 'timing', label: 'Timing Analysis' },
          { id: 'intent', label: 'Intent Assessment' }
        ],
        edges: [
          { from: 'deviation', to: 'intent' },
          { from: 'speed', to: 'intent' },
          { from: 'timing', to: 'intent' }
        ]
      },
      shap: {
        "Course Change": 0.45,
        "Speed Increase": 0.35,
        "ATC Non-Response": 0.4,
        "Timing Factor": 0.25
      }
    },
    projection: {
      text: "Deviation trajectory analysis:\n• Current path leads to restricted airspace\n• Estimated breach in 15 minutes at current speed\n• Multiple critical assets within potential target zone",
      alternatives: [
        {
          title: "If deviation continues",
          details: "Aircraft will enter restricted airspace, triggering automatic defense protocols and potential engagement."
        },
        {
          title: "If aircraft corrects course",
          details: "Threat level decreases but continued monitoring required until aircraft exits threat radius."
        }
      ]
    },
    confidence: 92
  },

  'speed_analysis': {
    response: "Speed analysis: Aircraft has increased velocity by 50% without flight plan modification.",
    insight: {
      text: "Speed change indicators:\n• Original speed: 120 knots (cruise)\n• Current speed: 180 knots (50% increase)\n• Acceleration began 8 minutes ago\n• No flight plan amendment filed\n• Fuel consumption now exceeds normal parameters",
      lime: ["speed_increase", "acceleration_timing", "fuel_consumption"]
    },
    reasoning: {
      text: "Speed increase analysis:\n• Acceleration pattern inconsistent with normal flight operations\n• Timing correlates with course deviation event\n• Current speed suggests urgency or evasive maneuvering\n• Fuel burn rate indicates limited operational time remaining",
      dag: {
        nodes: [
          { id: 'acceleration', label: 'Speed Increase' },
          { id: 'fuel', label: 'Fuel Analysis' },
          { id: 'operations', label: 'Flight Operations' },
          { id: 'intent', label: 'Operational Intent' }
        ],
        edges: [
          { from: 'acceleration', to: 'intent' },
          { from: 'fuel', to: 'intent' },
          { from: 'operations', to: 'intent' }
        ]
      },
      shap: {
        "Speed Increase": 0.5,
        "Acceleration Rate": 0.3,
        "Fuel Consumption": 0.25,
        "Flight Plan Deviation": 0.4
      }
    },
    confidence: 88
  },

  'threat_pattern': {
    response: "Threat pattern analysis: Current behavior matches 85% of known adversarial probing profiles.",
    reasoning: {
      text: "Pattern correlation analysis:\n• Flight behavior matches 2019 and 2021 incidents\n• Speed/course combination seen in threat scenarios\n• Timing exploits known operational vulnerabilities\n• Geographic approach vector tactically significant",
      dag: {
        nodes: [
          { id: 'historical', label: 'Historical Patterns' },
          { id: 'behavior', label: 'Flight Behavior' },
          { id: 'timing', label: 'Timing Analysis' },
          { id: 'geography', label: 'Geographic Vector' },
          { id: 'threat', label: 'Threat Assessment' }
        ],
        edges: [
          { from: 'historical', to: 'threat' },
          { from: 'behavior', to: 'threat' },
          { from: 'timing', to: 'threat' },
          { from: 'geography', to: 'threat' }
        ]
      },
      shap: {
        "Historical Match": 0.4,
        "Behavior Pattern": 0.45,
        "Timing Correlation": 0.3,
        "Geographic Significance": 0.35
      }
    },
    projection: {
      text: "Threat pattern projection:\n• 85% probability of adversarial intent\n• Pattern suggests probing or reconnaissance mission\n• High likelihood of additional aircraft in area",
      alternatives: [
        {
          title: "If pattern continues",
          details: "Threat level escalates to critical, requiring immediate defensive response."
        },
        {
          title: "If pattern breaks",
          details: "May indicate successful deterrence or shift to alternative approach vector."
        }
      ]
    },
    confidence: 85
  },

  'intercept_options': {
    response: "Intercept analysis: Multiple response options available with varying timelines and success rates.",
    reasoning: {
      text: "Intercept capability assessment:\n• CF-18 from Cold Lake: 8-minute response, 95% success rate\n• CF-18 from Bagotville: 12-minute response, 90% success rate\n• Ground-based systems: Immediate readiness, 98% effectiveness\n• Civilian traffic diversion: 3-minute clearance, 100% success",
      dag: {
        nodes: [
          { id: 'cold_lake', label: 'Cold Lake Assets' },
          { id: 'bagotville', label: 'Bagotville Assets' },
          { id: 'ground', label: 'Ground Systems' },
          { id: 'civilian', label: 'Airspace Management' },
          { id: 'response', label: 'Response Decision' }
        ],
        edges: [
          { from: 'cold_lake', to: 'response' },
          { from: 'bagotville', to: 'response' },
          { from: 'ground', to: 'response' },
          { from: 'civilian', to: 'response' }
        ]
      },
      shap: {
        "Response Time": 0.5,
        "Success Probability": 0.4,
        "Resource Availability": 0.3,
        "Collateral Risk": -0.2
      }
    },
    projection: {
      text: "Intercept timeline projections:\n• Optimal intercept window: 6-10 minutes\n• Cold Lake deployment recommended for fastest response\n• Ground systems as backup if aerial intercept fails",
      alternatives: [
        {
          title: "Immediate aerial intercept",
          details: "Highest success rate but requires rapid deployment and coordination."
        },
        {
          title: "Ground-based response",
          details: "Guaranteed availability but limited to defensive engagement only."
        }
      ]
    },
    confidence: 90
  },

  'timeline': {
    response: "Timeline analysis: Critical decision points identified within current operational window.",
    projection: {
      text: "Critical timeline markers:\n• Current position: 45km from restricted boundary\n• Time to restricted airspace: 15 minutes at current speed\n• Intercept deployment window: Next 8 minutes\n• Point of no return: 12 minutes from now",
      alternatives: [
        {
          title: "Immediate action (0-3 minutes)",
          details: "Optimal response window with maximum options and highest success probability."
        },
        {
          title: "Delayed action (3-8 minutes)",
          details: "Reduced options but still viable for successful intercept and diversion."
        },
        {
          title: "Critical window (8-12 minutes)",
          details: "Limited to defensive measures only, offensive options no longer viable."
        }
      ]
    },
    confidence: 95
  },

  'general': {
    response: "Analysis complete: Comprehensive threat assessment based on current scenario parameters.",
    insight: {
      text: "Current situation summary:\n• Unresponsive aircraft on deviation course\n• Multiple threat indicators present\n• Critical infrastructure at risk\n• Immediate response options available",
      lime: ["aircraft_status", "threat_indicators", "infrastructure_risk"]
    },
    confidence: 80
  }
};

export const generateScriptedResponse = (query: string): XAIExplanation => {
  // Analyze query to determine appropriate tab
  const suggestedTab = analyzeQueryForTab(query);
  
  // Get query context for specific response
  const context = getQueryContext(query);
  
  // Get base template
  const template = responseTemplates[context] || responseTemplates['general'];
  
  // Build comprehensive response
  const response: XAIExplanation = {
    ...xaiExplanation,
    ...template,
    defaultTab: suggestedTab,
    suggestedPrompts: [
      "What are the intercept options?",
      "Why is this pattern suspicious?",
      "What happens if we wait?",
      "Explain the speed increase"
    ]
  };

  return response;
};