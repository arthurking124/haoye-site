"use client";
import React from 'react';
import { motion } from 'framer-motion';

const Signature = () => {
  // 这是咱们精调的“皓野”单线路径
  const signaturePath = "M10,85 C25,45 45,40 55,80 C65,120 85,115 100,70 C100,70 110,100 130,105 L145,50 C160,100 200,130 240,75 C270,30 330,65 300,125 L420,60";

  return (
    <div className="inline-flex items-center">
      <svg 
        viewBox="0 0 450 160" 
        className="w-48 h-auto overflow-visible" // w-48控制显示大小，你可以改w-32或w-64
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d={signaturePath}
          stroke="white"           // 墨迹颜色
          strokeWidth="3.5"       // 粗细
          strokeLinecap="round"   // 圆润笔尖
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1 
          }}
          transition={{
            pathLength: { 
              duration: 3,         // 3秒写完，想快点就改成2
              ease: [0.45, 0.05, 0.55, 0.95] // 运笔节奏
            },
            opacity: { duration: 0.5 }
          }}
        />
      </svg>
    </div>
  );
};

export default Signature;