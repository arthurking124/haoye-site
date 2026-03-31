"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';

/**
 * 皓野个人签名组件
 * 修复了 TypeScript 类型报错，并还原了手写单线轨迹
 */
const Signature = () => {
  // 定义动画变体，强制指定 Variants 类型避开 TS 检查
  const pathVariants: Variants = {
    hidden: { 
      pathLength: 0, 
      opacity: 0 
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 2.2,
        ease: [0.45, 0, 0.55, 1], // 模拟真实的运笔由慢到快，再收笔的节奏
      }
    }
  };

  return (
    <div className="flex justify-center items-center py-10 bg-transparent">
      <motion.svg
        viewBox="0 0 400 200"
        // 这里的 text-slate-800 是亮色模式下的墨水色，dark:text-white 是暗色模式
        className="w-72 h-auto stroke-current text-slate-800 dark:text-slate-100"
        initial="hidden"
        whileInView="visible" // 当滚动到视野内时开始书写
        viewport={{ once: true }} // 只执行一次动画
      >
        <g 
          fill="none" 
          strokeWidth="3.5" // 粗细刚好，既有签字笔的感觉，又不会显得臃肿
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {/* “皓”字 - 还原了你照片左侧的结构和右侧的转折 */}
          <motion.path
            d="M80,70 c15,-2 30,-5 45,-8 M105,50 c0,15 -2,40 -2,55 M90,105 c15,-2 30,-5 45,-8 M85,135 c10,0 20,-5 25,-15 c5,-10 0,-25 -10,-25 c-15,0 -20,15 -15,30 c5,15 25,20 40,25 M155,55 c0,40 2,75 5,95 c2,15 15,20 35,15 M155,105 c15,-5 35,-10 50,-15 M200,60 l0,90"
            variants={pathVariants}
          />
          
          {/* “野”字 - 还原了你那个标志性的右侧撇捺和最后那记长横 */}
          <motion.path
            d="M250,65 l50,-5 l0,50 l-50,5 z M250,90 l50,-5 M275,65 l0,50 M245,130 l70,-10 M280,120 l0,55 M230,175 c40,-5 100,-15 150,-25"
            variants={pathVariants}
          />
        </g>
      </motion.svg>
    </div>
  );
};

export default Signature;