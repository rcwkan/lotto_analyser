
# Lottery Result Analysis 


## React Native App

### Feature:
- Mathematical and statistical analysis 
- Mathematical and statistical Prediction
- TensorFlow Lite model prediction
- Combined TensorFlow Lite model and statistical Prediction

### AI Assistant:
 - Gemini 2.5 Pro - Base project generation, reasoning and coding
 - Claude Sonnet 4 - reasoning and coding
 - Chatgpt 4 & 5 - Debugging 
 - Qwen3-Coder-30B-A3B-Instruct.f16 and qwen2.5-coder:32b-instruct-fp16 (Local) - Evaluation and comparison only

### Background: 
 - Zero knowledge of React Native or React
 - Less than 1 year experience of flutter mobile app development
 - Angular and AngularJs 7 years+ experience
 - JAVA 15 years+ experience

### Challenges Faced:

When attempting to integrate Expo with specific UI libraries (e.g., React Native Paper, GlueStack, React Native Elements, UI Kitten, Claude, ChatGPT, Qwen3, and Qwen2.5), most AI assistants were unable to generate a functional base project. Only Gemini 2.5 Pro was able to produce a working base project from high-level requirements, such as integrating Expo with Material UI and React Native Paper.

During the integration of TensorFlow Lite with React Native Expo, both Gemini 2.5 Pro and ChatGPT failed to recognize that @tensorflow/tfjs-react-native is incompatible with the latest version of Expo. After extensive troubleshooting, a workaround using npm install @tensorflow/tfjs-react-native --legacy-peer-deps was discovered through Stack Overflow, but the integration ultimately remained unsuccessful.

As an alternative, react-native-fast-tflite was explored. However, all AI assistants demonstrated limitations, as they primarily defaulted to popular libraries and were unable to provide correct implementation guidance for react-native-fast-tflite.


### Impressions:

Gemini 2.5 Pro and Claude Sonnet 4 demonstrated exceptional capabilities. With as few as two prompts, they were able to generate a functional React Native application featuring a polished UI. Additional features could be incorporated within minutes through follow-up prompts—work that might otherwise take developers several weeks to complete.

ChatGPT often outperforms traditional resources such as Stack Overflow when it comes to troubleshooting and providing clear, contextual solutions.

Overall, AI assistants perform like highly skilled coders, excelling at generating code and scaffolding applications. However, they face limitations in handling compatibility challenges, integrating diverse components seamlessly, and effectively working with less commonly used libraries.
 


 


