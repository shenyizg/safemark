import type { Component } from 'vue'

export interface SegmentOption<V> {
  value: V
  label: string
  icon?: Component
  title?: string
}
