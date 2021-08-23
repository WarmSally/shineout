/**
 * cn - 基本用法
 *    -- 为子元素设置水平和垂直间距
 * en - Base
 *    -- Set horizontal and vertical spacing for child elements
 */
import React from 'react'
import { Gap, Tag } from 'shineout'

const tagStyle = { margin: 0 }
export default function() {
  return (
    <Gap style={{ width: 400 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <Tag key={i} style={tagStyle}>
          Tag
          {i}
        </Tag>
      ))}
    </Gap>
  )
}
