import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, HeartPulse, Brain, Activity, Moon, ShieldAlert, User, Users, Coffee, Smartphone, Stethoscope } from 'lucide-react';
import api from '../services/api';
import { useWellness } from '../context/WellnessContext';

/* ─── Question Banks & Metadata ────────────────────────────── */
const WHO5_QUESTIONS = [
  'I have felt cheerful and in good spirits',
  'I have felt calm and relaxed',
  'I have felt active and vigorous',
  'I woke up feeling fresh and rested',
  'My daily life has been filled with things that interest me',
];

const WHO5_OPTIONS = [
  { value: 5, label: 'All of the time' },
  { value: 4, label: 'Most of the time' },
  { value: 3, label: 'More than half of the time' },
  { value: 2, label: 'Less than half of the time' },
  { value: 1, label: 'Some of the time' },
  { value: 0, label: 'At no time' },
];

const PSS10_QUESTIONS = [
  'In the last month, how often have you been upset because of something that happened unexpectedly?',
  'In the last month, how often have you felt that you were unable to control the important things in your life?',
  'In the last month, how often have you felt nervous and stressed?',
  'In the last month, how often have you felt confident about your ability to handle your personal problems?',
  'In the last month, how often have you felt that things were going your way?',
  'In the last month, how often have you been able to cope with all the things that you had to do?',
  'In the last month, how often have you been able to control irritations in your life?',
  'In the last month, how often have you felt that you were on top of things?',
  'In the last month, how often have you been angered because of things that happened that were outside of your control?',
  'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?',
];

const PSS10_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Almost never' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Fairly often' },
  { value: 4, label: 'Very often' },
];

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
];

const GAD7_PHQ9_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure, or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
];

const STEPS = [
  { id: 1, title: 'Personal Information', icon: User },
  { id: 2, title: 'Social & Relationship', icon: Users },
  { id: 3, title: 'Stress Profile', icon: Brain },
  { id: 4, title: 'Digital & Activity', icon: Smartphone },
  { id: 5, title: 'Diet & Daily Habits', icon: Coffee },
  { id: 6, title: 'Recovery & Wellness', icon: Moon },
  { id: 7, title: 'Medical & Health', icon: Stethoscope },
  { id: 8, title: 'WHO-5 Assessment', icon: Sparkles },
  { id: 9, title: 'PSS-10 Assessment', icon: Activity },
  { id: 10, title: 'GAD-7 Assessment', icon: HeartPulse },
  { id: 11, title: 'PHQ-9 Assessment', icon: ShieldAlert },
];

  export default function AssessmentPage() {
  const navigate = useNavigate();
  const topRef = useRef(null);
  const { refresh: refreshContext } = useWellness();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Raw dataset-aligned form state (starts empty — pre-filled if user has saved profile)
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    Age: '',
    Gender: '',
    Height_cm: '',
    Weight_kg: '',
    Education_Level: '',
    Occupation: '',
    Work_Pattern: '',
    Living_Arrangement: '',
    Relationship_Status: '',

    // Step 2: Social & Relationship
    Relationship_Satisfaction_0_10: '',
    Social_Circle_Size: '',
    Social_Interaction_Frequency_0_10: '',
    Social_Support_Score_0_10: '',
    Family_Contact_Frequency_0_10: '',
    Loneliness_Score_0_10: '',

    // Step 3: Stress Profile
    Academic_Stress_0_10: '',
    Work_Stress_0_10: '',
    Financial_Stress_0_10: '',

    // Step 4: Digital & Activity
    Screen_Time_Hours: '',
    Social_Media_Hours: '',
    Physical_Activity_Minutes_Daily: '',
    Exercise_Days_Per_Week: '',
    Sedentary_Hours_Daily: '',

    // Step 5: Diet & Daily Habits
    Dietary_Quality_0_10: '',
    Meals_Per_Day: '',
    Water_Intake_Liters: '',
    Caffeine_Cups_Daily: '',
    Smoking_Status: '',
    Alcohol_Frequency: '',
    Substance_Use: '',

    // Step 6: Recovery & Wellness
    Sleep_Hours: '',
    Sleep_Quality_0_10: '',
    Sleep_Efficiency_Percent: '',

    // Step 7: Medical Context
    Chronic_Condition: '',
    Number_of_Chronic_Conditions: '',
    Current_Medications: '',
    Previous_Diagnosis: '',
    Allergies: '',
    Physical_Limitation: '',

    // Step 8: WHO-5 (undefined by default so options are not pre-selected)
    WHO5_Q1: undefined, WHO5_Q2: undefined, WHO5_Q3: undefined, WHO5_Q4: undefined, WHO5_Q5: undefined,

    // Step 9: PSS-10 (undefined by default so options are not pre-selected)
    PSS10_Q1: undefined, PSS10_Q2: undefined, PSS10_Q3: undefined, PSS10_Q4: undefined, PSS10_Q5: undefined,
    PSS10_Q6: undefined, PSS10_Q7: undefined, PSS10_Q8: undefined, PSS10_Q9: undefined, PSS10_Q10: undefined,

    // Step 10: GAD-7 (undefined by default so options are not pre-selected)
    GAD7_Q1: undefined, GAD7_Q2: undefined, GAD7_Q3: undefined, GAD7_Q4: undefined, GAD7_Q5: undefined, GAD7_Q6: undefined, GAD7_Q7: undefined,

    // Step 11: PHQ-9 (undefined by default so options are not pre-selected)
    PHQ9_Q1: undefined, PHQ9_Q2: undefined, PHQ9_Q3: undefined, PHQ9_Q4: undefined, PHQ9_Q5: undefined,
    PHQ9_Q6: undefined, PHQ9_Q7: undefined, PHQ9_Q8: undefined, PHQ9_Q9: undefined,
  });

  // Prefill profile data if already saved in profile page
  useEffect(() => {
    const fetchExistingProfile = async () => {
      try {
        const res = await api.get('/profile');
        if (res.success && res.data) {
          const d = res.data;
          setFormData((prev) => ({
            ...prev,
            Age: d.age ? Number(d.age) : prev.Age,
            Gender: d.gender ? (d.gender.charAt(0).toUpperCase() + d.gender.slice(1)) : prev.Gender,
            Height_cm: d.height ? Number(d.height) : prev.Height_cm,
            Weight_kg: d.weight ? Number(d.weight) : prev.Weight_kg,
            Education_Level: d.education || prev.Education_Level,
            Occupation: d.occupation || prev.Occupation,
            Work_Pattern: d.workPattern || prev.Work_Pattern
          }));
        }
      } catch (err) {
        console.warn('Profile prefill fetch error:', err);
      }
    };
    fetchExistingProfile();
  }, []);

  // Calculate BMI on the fly
  const calculatedBMI = formData.Height_cm > 0 && formData.Weight_kg > 0
    ? (formData.Weight_kg / Math.pow(formData.Height_cm / 100, 2)).toFixed(2)
    : 0;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateCurrentStep = () => {
    if (step === 1) {
      if (!formData.Age) return 'Please enter your Age.';
      if (!formData.Gender) return 'Please select your Gender.';
      if (!formData.Height_cm) return 'Please enter your Height in cm.';
      if (!formData.Weight_kg) return 'Please enter your Weight in kg.';
    }
    if (step === 8) {
      for (let i = 1; i <= 5; i++) {
        if (formData[`WHO5_Q${i}`] === undefined) return 'Please answer all WHO-5 questions before continuing.';
      }
    }
    if (step === 9) {
      for (let i = 1; i <= 10; i++) {
        if (formData[`PSS10_Q${i}`] === undefined) return 'Please answer all PSS-10 questions before continuing.';
      }
    }
    if (step === 10) {
      for (let i = 1; i <= 7; i++) {
        if (formData[`GAD7_Q${i}`] === undefined) return 'Please answer all GAD-7 questions before continuing.';
      }
    }
    if (step === 11) {
      for (let i = 1; i <= 9; i++) {
        if (formData[`PHQ9_Q${i}`] === undefined) return 'Please answer all PHQ-9 questions before submitting.';
      }
    }
    return null;
  };

  const handleNext = () => {
    setErrorMsg(null);
    const err = validateCurrentStep();
    if (err) {
      setErrorMsg(err);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (step < STEPS.length) {
      setStep((prev) => prev + 1);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const cleanFormData = { ...formData };

      // Set numeric defaults for dataset ML evaluation if optional inputs were left blank
      if (!cleanFormData.Age) cleanFormData.Age = 25;
      if (!cleanFormData.Gender) cleanFormData.Gender = 'Female';
      if (!cleanFormData.Height_cm) cleanFormData.Height_cm = 165;
      if (!cleanFormData.Weight_kg) cleanFormData.Weight_kg = 65;
      if (!cleanFormData.Education_Level) cleanFormData.Education_Level = 'Undergraduate';
      if (!cleanFormData.Occupation) cleanFormData.Occupation = 'Student';
      if (!cleanFormData.Work_Pattern) cleanFormData.Work_Pattern = 'Day';
      if (!cleanFormData.Living_Arrangement) cleanFormData.Living_Arrangement = 'With Parents';
      if (!cleanFormData.Relationship_Status) cleanFormData.Relationship_Status = 'Single';

      if (cleanFormData.Relationship_Satisfaction_0_10 === '') cleanFormData.Relationship_Satisfaction_0_10 = 5;
      if (cleanFormData.Social_Circle_Size === '') cleanFormData.Social_Circle_Size = 5;
      if (cleanFormData.Social_Interaction_Frequency_0_10 === '') cleanFormData.Social_Interaction_Frequency_0_10 = 5;
      if (cleanFormData.Social_Support_Score_0_10 === '') cleanFormData.Social_Support_Score_0_10 = 5;
      if (cleanFormData.Family_Contact_Frequency_0_10 === '') cleanFormData.Family_Contact_Frequency_0_10 = 5;
      if (cleanFormData.Loneliness_Score_0_10 === '') cleanFormData.Loneliness_Score_0_10 = 4;

      if (cleanFormData.Academic_Stress_0_10 === '') cleanFormData.Academic_Stress_0_10 = 4;
      if (cleanFormData.Work_Stress_0_10 === '') cleanFormData.Work_Stress_0_10 = 3;
      if (cleanFormData.Financial_Stress_0_10 === '') cleanFormData.Financial_Stress_0_10 = 3;

      if (cleanFormData.Screen_Time_Hours === '') cleanFormData.Screen_Time_Hours = 6.5;
      if (cleanFormData.Social_Media_Hours === '') cleanFormData.Social_Media_Hours = 2.5;
      if (cleanFormData.Physical_Activity_Minutes_Daily === '') cleanFormData.Physical_Activity_Minutes_Daily = 45;
      if (cleanFormData.Exercise_Days_Per_Week === '') cleanFormData.Exercise_Days_Per_Week = 3;
      if (cleanFormData.Sedentary_Hours_Daily === '') cleanFormData.Sedentary_Hours_Daily = 6;

      if (cleanFormData.Dietary_Quality_0_10 === '') cleanFormData.Dietary_Quality_0_10 = 6;
      if (cleanFormData.Meals_Per_Day === '') cleanFormData.Meals_Per_Day = 3;
      if (cleanFormData.Water_Intake_Liters === '') cleanFormData.Water_Intake_Liters = 2.0;
      if (cleanFormData.Caffeine_Cups_Daily === '') cleanFormData.Caffeine_Cups_Daily = 2;
      if (!cleanFormData.Smoking_Status) cleanFormData.Smoking_Status = 'Never';
      if (!cleanFormData.Alcohol_Frequency) cleanFormData.Alcohol_Frequency = 'Never';
      if (!cleanFormData.Substance_Use) cleanFormData.Substance_Use = 'No';

      if (cleanFormData.Sleep_Hours === '') cleanFormData.Sleep_Hours = 7.0;
      if (cleanFormData.Sleep_Quality_0_10 === '') cleanFormData.Sleep_Quality_0_10 = 7;
      if (cleanFormData.Sleep_Efficiency_Percent === '') cleanFormData.Sleep_Efficiency_Percent = 75;

      if (!cleanFormData.Chronic_Condition) cleanFormData.Chronic_Condition = 'None';
      if (cleanFormData.Number_of_Chronic_Conditions === '') cleanFormData.Number_of_Chronic_Conditions = 0;
      if (!cleanFormData.Current_Medications) cleanFormData.Current_Medications = 'None';
      if (!cleanFormData.Previous_Diagnosis) cleanFormData.Previous_Diagnosis = 'None';
      if (!cleanFormData.Allergies) cleanFormData.Allergies = 'None';
      if (!cleanFormData.Physical_Limitation) cleanFormData.Physical_Limitation = 'None';

      for (let i = 1; i <= 5; i++) if (cleanFormData[`WHO5_Q${i}`] === undefined) cleanFormData[`WHO5_Q${i}`] = 3;
      for (let i = 1; i <= 10; i++) if (cleanFormData[`PSS10_Q${i}`] === undefined) cleanFormData[`PSS10_Q${i}`] = 2;
      for (let i = 1; i <= 7; i++) if (cleanFormData[`GAD7_Q${i}`] === undefined) cleanFormData[`GAD7_Q${i}`] = 0;
      for (let i = 1; i <= 9; i++) if (cleanFormData[`PHQ9_Q${i}`] === undefined) cleanFormData[`PHQ9_Q${i}`] = 0;

      // Sync demographic values back to user profile for 100% data consistency
      try {
        await api.put('/profile', {
          age: Number(formData.Age) || undefined,
          gender: formData.Gender ? String(formData.Gender).toLowerCase() : undefined,
          height: Number(formData.Height_cm) || undefined,
          weight: Number(formData.Weight_kg) || undefined,
          education: formData.Education_Level || undefined,
          occupation: formData.Occupation || undefined,
          workPattern: formData.Work_Pattern || undefined
        });
      } catch (pErr) {
        console.warn('Profile sync warning:', pErr);
      }

      const payload = {
        ...cleanFormData,
        BMI: Number(calculatedBMI),
      };

      const response = await api.post('/wellness/evaluate', { rawInputs: payload });
      const isSuccess = response?.success || response?.data?.success;
      const resData = response?.data || response?.data?.data;

      if (isSuccess && resData) {
        if (refreshContext) {
          try { await refreshContext(); } catch (rCtxErr) { console.warn('Context refresh warning:', rCtxErr); }
        }

        // Evaluate Reasoning Decision Agent
        let journeyData = null;
        try {
          const reasoningRes = await api.post('/reasoning/next-action', {
            wellnessResult: resData.result,
            completedAgents: []
          });
          journeyData = reasoningRes?.data || reasoningRes?.data?.data;
        } catch (rErr) {
          console.warn('Reasoning decision fetch non-fatal error:', rErr);
        }

        navigate('/report', { state: { wellnessData: resData, journey: journeyData } });
      } else {
        setErrorMsg(response?.message || 'Failed to process assessment evaluation.');
      }
    } catch (err) {
      console.error('Assessment submission error:', err);
      setErrorMsg(err.response?.data?.message || 'Error submitting assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepInfo = STEPS[step - 1];
  const StepIcon = currentStepInfo.icon;
  const progressPct = Math.round((step / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6">
      <div ref={topRef} />
      <div className="max-w-3xl mx-auto">
        
        {/* Header Progress Strip */}
        <div className="mb-8 bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                <StepIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">
                  Step {step} of {STEPS.length}
                </span>
                <h1 className="text-lg font-bold text-white">{currentStepInfo.title}</h1>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-400">{progressPct}%</span>
          </div>

          <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-sm">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-slate-400 text-sm">
                Provide your basic demographic details. Your BMI is computed automatically.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    placeholder="Enter age (e.g. 25)"
                    value={formData.Age}
                    onChange={(e) => handleChange('Age', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                  <select
                    value={formData.Gender}
                    onChange={(e) => handleChange('Gender', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="" disabled>Select Gender...</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="Enter height (e.g. 165)"
                    value={formData.Height_cm}
                    onChange={(e) => handleChange('Height_cm', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="Enter weight (e.g. 65)"
                    value={formData.Weight_kg}
                    onChange={(e) => handleChange('Weight_kg', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Auto Calculated BMI Badge */}
              <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between">
                <span className="text-xs text-purple-300 font-medium">Calculated Body Mass Index (BMI):</span>
                <span className="text-lg font-extrabold text-purple-400">{calculatedBMI > 0 ? `${calculatedBMI} kg/m²` : '—'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Education Level</label>
                  <select
                    value={formData.Education_Level}
                    onChange={(e) => handleChange('Education_Level', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="" disabled>Select Education Level...</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Doctorate">Doctorate</option>
                    <option value="Higher Secondary">Higher Secondary</option>
                    <option value="Secondary">Secondary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Occupation</label>
                  <select
                    value={formData.Occupation}
                    onChange={(e) => handleChange('Occupation', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="" disabled>Select Occupation...</option>
                    <option value="Student">Student</option>
                    <option value="Student + Part-time">Student + Part-time</option>
                    <option value="Employed">Employed</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Retired">Retired</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Work Pattern</label>
                  <select
                    value={formData.Work_Pattern}
                    onChange={(e) => handleChange('Work_Pattern', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="" disabled>Select Work Pattern...</option>
                    <option value="Day">Day Shift</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="Night">Night Shift</option>
                    <option value="Rotating Shift">Rotating Shift</option>
                    <option value="Flexible">Flexible</option>
                    <option value="Sedentary">Sedentary</option>
                    <option value="Physically active">Physically active</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Living Arrangement</label>
                  <select
                    value={formData.Living_Arrangement}
                    onChange={(e) => handleChange('Living_Arrangement', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="" disabled>Select Living Arrangement...</option>
                    <option value="With Parents">With Parents</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Away From Parents">Away From Parents</option>
                    <option value="With Friends">With Friends</option>
                    <option value="Alone">Alone</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Relationship Status</label>
                  <select
                    value={formData.Relationship_Status}
                    onChange={(e) => handleChange('Relationship_Status', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="" disabled>Select Relationship Status...</option>
                    <option value="Single">Single</option>
                    <option value="In Relationship">In Relationship</option>
                    <option value="Married">Married</option>
                    <option value="Separated/Divorced">Separated / Divorced</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Social & Relationship Well-Being */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">
                Rate your social connections, family frequency, and relationship dynamics on a scale from 0 (Lowest/Never) to 10 (Highest/Extremely Frequent).
              </p>

              {formData.Relationship_Status !== 'Single' && (
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Relationship Satisfaction (0 - 10)</span>
                    <span className="font-bold text-purple-400">{formData.Relationship_Satisfaction_0_10}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.Relationship_Satisfaction_0_10}
                    onChange={(e) => handleChange('Relationship_Satisfaction_0_10', Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Social Circle Size (Close Friends/Confidants)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.Social_Circle_Size}
                  onChange={(e) => handleChange('Social_Circle_Size', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Social Interaction Frequency (0 - 10)</span>
                  <span className="font-bold text-purple-400">{formData.Social_Interaction_Frequency_0_10}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.Social_Interaction_Frequency_0_10}
                  onChange={(e) => handleChange('Social_Interaction_Frequency_0_10', Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Social Support Rating (0 - 10)</span>
                  <span className="font-bold text-purple-400">{formData.Social_Support_Score_0_10}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.Social_Support_Score_0_10}
                  onChange={(e) => handleChange('Social_Support_Score_0_10', Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Family Contact Frequency (0 - 10)</span>
                  <span className="font-bold text-purple-400">{formData.Family_Contact_Frequency_0_10}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.Family_Contact_Frequency_0_10}
                  onChange={(e) => handleChange('Family_Contact_Frequency_0_10', Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Perceived Loneliness Score (0 = None, 10 = Severe)</span>
                  <span className="font-bold text-rose-400">{formData.Loneliness_Score_0_10}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.Loneliness_Score_0_10}
                  onChange={(e) => handleChange('Loneliness_Score_0_10', Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Stress Profile */}
          {step === 3 && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">
                Rate domain-specific stress pressures from 0 (No Stress) to 10 (Extremely High Stress).
              </p>

              {(formData.Occupation.includes('Student')) && (
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Academic Stress (0 - 10)</span>
                    <span className="font-bold text-amber-400">{formData.Academic_Stress_0_10}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.Academic_Stress_0_10}
                    onChange={(e) => handleChange('Academic_Stress_0_10', Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              )}

              {formData.Occupation !== 'Unemployed' && formData.Occupation !== 'Retired' && (
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Work/Job Stress (0 - 10)</span>
                    <span className="font-bold text-amber-400">{formData.Work_Stress_0_10}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.Work_Stress_0_10}
                    onChange={(e) => handleChange('Work_Stress_0_10', Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Financial Stress (0 - 10)</span>
                  <span className="font-bold text-amber-400">{formData.Financial_Stress_0_10}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.Financial_Stress_0_10}
                  onChange={(e) => handleChange('Financial_Stress_0_10', Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Digital & Activity Behavior */}
          {step === 4 && (
            <div className="space-y-5">
              <p className="text-slate-400 text-sm">
                Enter your average daily screen usage, physical movement duration, and sedentary hours.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Screen Time (Hours/Day)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.Screen_Time_Hours}
                    onChange={(e) => handleChange('Screen_Time_Hours', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Social Media Time (Hours/Day)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.Social_Media_Hours}
                    onChange={(e) => handleChange('Social_Media_Hours', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Physical Activity (Minutes/Day)</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={formData.Physical_Activity_Minutes_Daily}
                    onChange={(e) => handleChange('Physical_Activity_Minutes_Daily', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Exercise Days Per Week</label>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={formData.Exercise_Days_Per_Week}
                    onChange={(e) => handleChange('Exercise_Days_Per_Week', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sedentary Hours Daily (Sitting/Idle)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.Sedentary_Hours_Daily}
                    onChange={(e) => handleChange('Sedentary_Hours_Daily', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Diet & Daily Habits */}
          {step === 5 && (
            <div className="space-y-5">
              <p className="text-slate-400 text-sm">
                Sharing dietary and habit indicators helps calibrate lifestyle balance recommendations.
              </p>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Dietary Quality Rating (0 = Poor, 10 = Excellent)</span>
                  <span className="font-bold text-emerald-400">{formData.Dietary_Quality_0_10}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.Dietary_Quality_0_10}
                  onChange={(e) => handleChange('Dietary_Quality_0_10', Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Meals Per Day</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.Meals_Per_Day}
                    onChange={(e) => handleChange('Meals_Per_Day', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Water Intake (Liters/Day)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.Water_Intake_Liters}
                    onChange={(e) => handleChange('Water_Intake_Liters', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Caffeine (Cups/Day)</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={formData.Caffeine_Cups_Daily}
                    onChange={(e) => handleChange('Caffeine_Cups_Daily', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Smoking Status</label>
                  <select
                    value={formData.Smoking_Status}
                    onChange={(e) => handleChange('Smoking_Status', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Never">Never</option>
                    <option value="Former">Former</option>
                    <option value="Occasional">Occasional</option>
                    <option value="Regular">Regular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Alcohol Frequency</label>
                  <select
                    value={formData.Alcohol_Frequency}
                    onChange={(e) => handleChange('Alcohol_Frequency', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Never">Never</option>
                    <option value="Rarely">Rarely</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Frequent">Frequent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Substance Use</label>
                  <select
                    value={formData.Substance_Use}
                    onChange={(e) => handleChange('Substance_Use', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="Prefer not to answer">Prefer not to answer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Recovery & Wellness */}
          {step === 6 && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">
                Evaluation of sleep duration, sleep quality rating, and sleep efficiency.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Average Sleep Duration (Hours/Night)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="16"
                  value={formData.Sleep_Hours}
                  onChange={(e) => handleChange('Sleep_Hours', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Sleep Quality Rating (0 = Poor, 10 = Restful)</span>
                  <span className="font-bold text-indigo-400">{formData.Sleep_Quality_0_10}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.Sleep_Quality_0_10}
                  onChange={(e) => handleChange('Sleep_Quality_0_10', Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sleep Efficiency Percentage (%)</label>
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={formData.Sleep_Efficiency_Percent}
                  onChange={(e) => handleChange('Sleep_Efficiency_Percent', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* STEP 7: Medical & Health Context */}
          {step === 7 && (
            <div className="space-y-5">
              <p className="text-slate-400 text-sm">
                Optional and privacy-aware medical context to tailor exercise and recovery safety guardrails.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Chronic Condition</label>
                  <select
                    value={formData.Chronic_Condition}
                    onChange={(e) => handleChange('Chronic_Condition', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="None">None</option>
                    <option value="Asthma">Asthma</option>
                    <option value="Hypertension">Hypertension</option>
                    <option value="Diabetes">Diabetes</option>
                    <option value="Thyroid Disorder">Thyroid Disorder</option>
                    <option value="Migraine">Migraine</option>
                    <option value="Heart Condition">Heart Condition</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to answer">Prefer not to answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Number of Chronic Conditions</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.Number_of_Chronic_Conditions}
                    onChange={(e) => handleChange('Number_of_Chronic_Conditions', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Current Medications</label>
                  <select
                    value={formData.Current_Medications}
                    onChange={(e) => handleChange('Current_Medications', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="None">None</option>
                    <option value="1 medication">1 medication</option>
                    <option value="2 medications">2 medications</option>
                    <option value="3+ medications">3+ medications</option>
                    <option value="Prefer not to answer">Prefer not to answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Previous Diagnosis</label>
                  <select
                    value={formData.Previous_Diagnosis}
                    onChange={(e) => handleChange('Previous_Diagnosis', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="None">None</option>
                    <option value="Anxiety">Anxiety</option>
                    <option value="Depression">Depression</option>
                    <option value="Both Anxiety and Depression">Both Anxiety and Depression</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to answer">Prefer not to answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Allergies</label>
                  <select
                    value={formData.Allergies}
                    onChange={(e) => handleChange('Allergies', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="None">None</option>
                    <option value="Dust/Pollen">Dust / Pollen</option>
                    <option value="Food">Food</option>
                    <option value="Medication">Medication</option>
                    <option value="Multiple">Multiple</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to answer">Prefer not to answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Limitation</label>
                  <select
                    value={formData.Physical_Limitation}
                    onChange={(e) => handleChange('Physical_Limitation', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="None">None</option>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Prefer not to answer">Prefer not to answer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: WHO-5 Assessment */}
          {step === 8 && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">
                Over the past two weeks, how often have you felt each of the following?
              </p>

              {WHO5_QUESTIONS.map((q, idx) => {
                const key = `WHO5_Q${idx + 1}`;
                return (
                  <div key={key} className="p-4 bg-slate-900/60 border border-slate-700/50 rounded-xl space-y-2">
                    <p className="text-sm font-semibold text-white">{idx + 1}. {q}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {WHO5_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleChange(key, opt.value)}
                          className={`px-3 py-2 text-xs rounded-lg border transition-all text-left ${
                            formData[key] === opt.value
                              ? 'bg-purple-600 text-white border-purple-500 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {opt.label} ({opt.value})
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 9: PSS-10 Assessment */}
          {step === 9 && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">
                In the last month, how often have you felt the following?
              </p>

              {PSS10_QUESTIONS.map((q, idx) => {
                const key = `PSS10_Q${idx + 1}`;
                return (
                  <div key={key} className="p-4 bg-slate-900/60 border border-slate-700/50 rounded-xl space-y-2">
                    <p className="text-sm font-semibold text-white">{idx + 1}. {q}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {PSS10_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleChange(key, opt.value)}
                          className={`px-2 py-2 text-xs rounded-lg border transition-all text-center ${
                            formData[key] === opt.value
                              ? 'bg-purple-600 text-white border-purple-500 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {opt.label} ({opt.value})
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 10: GAD-7 Assessment */}
          {step === 10 && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">
                Over the last 2 weeks, how often have you been bothered by the following problems?
              </p>

              {GAD7_QUESTIONS.map((q, idx) => {
                const key = `GAD7_Q${idx + 1}`;
                return (
                  <div key={key} className="p-4 bg-slate-900/60 border border-slate-700/50 rounded-xl space-y-2">
                    <p className="text-sm font-semibold text-white">{idx + 1}. {q}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {GAD7_PHQ9_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleChange(key, opt.value)}
                          className={`px-3 py-2 text-xs rounded-lg border transition-all text-center ${
                            formData[key] === opt.value
                              ? 'bg-purple-600 text-white border-purple-500 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {opt.label} ({opt.value})
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 11: PHQ-9 Assessment */}
          {step === 11 && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">
                Over the last 2 weeks, how often have you been bothered by any of the following problems?
              </p>

              {PHQ9_QUESTIONS.map((q, idx) => {
                const key = `PHQ9_Q${idx + 1}`;
                const isSafetyQ = idx === 8;
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-xl space-y-2 border ${
                      isSafetyQ
                        ? 'bg-rose-950/30 border-rose-500/50'
                        : 'bg-slate-900/60 border-slate-700/50'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${isSafetyQ ? 'text-rose-300 flex items-center gap-2' : 'text-white'}`}>
                      {isSafetyQ && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                      {idx + 1}. {q}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {GAD7_PHQ9_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleChange(key, opt.value)}
                          className={`px-3 py-2 text-xs rounded-lg border transition-all text-center ${
                            formData[key] === opt.value
                              ? isSafetyQ ? 'bg-rose-600 text-white border-rose-400 font-bold' : 'bg-purple-600 text-white border-purple-500 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {opt.label} ({opt.value})
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-700/60">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 1 || submitting}
              className={`px-5 py-2.5 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-all ${
                step === 1 || submitting
                  ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg flex items-center gap-2 transition-all"
            >
              {submitting ? (
                <span>Evaluating...</span>
              ) : step === STEPS.length ? (
                <>Complete & Evaluate <CheckCircle2 className="w-4 h-4" /></>
              ) : (
                <>Save & Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
