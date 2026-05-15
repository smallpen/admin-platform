<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ActionDistributionItem } from '@/api/modules/stats.api'

echarts.use([TitleComponent, TooltipComponent, LegendComponent, PieChart, CanvasRenderer])

const props = defineProps<{
  data: ActionDistributionItem[]
  loading: boolean
}>()

const ACTION_COLORS: Record<string, string> = {
  CREATE: '#22C55E',
  UPDATE: '#4F6AF5',
  DELETE: '#EF4444',
  LOGIN: '#06B6D4',
  LOGOUT: '#94A3B8',
  ASSIGN: '#F59E0B',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: '新增',
  UPDATE: '編輯',
  DELETE: '刪除',
  LOGIN: '登入',
  LOGOUT: '登出',
  ASSIGN: '指派',
}

const chartEl = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

function buildOption() {
  const seriesData = props.data
    .filter(d => d.value > 0)
    .map(d => ({
      name: ACTION_LABELS[d.name] ?? d.name,
      value: d.value,
      itemStyle: { color: ACTION_COLORS[d.name] ?? '#94A3B8' },
    }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 次 ({d}%)',
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#64748b', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold' },
          scaleSize: 6,
        },
        data: seriesData.length > 0 ? seriesData : [{ name: '暫無資料', value: 1, itemStyle: { color: '#e2e8f0' } }],
      },
    ],
  }
}

onMounted(() => {
  if (chartEl.value) {
    chart = echarts.init(chartEl.value)
    chart.setOption(buildOption())
  }
  const ro = new ResizeObserver(() => chart?.resize())
  if (chartEl.value) ro.observe(chartEl.value)
  onUnmounted(() => {
    ro.disconnect()
    chart?.dispose()
  })
})

watch(() => props.data, () => {
  chart?.setOption(buildOption())
}, { deep: true })
</script>

<template>
  <div v-loading="loading" style="min-height: 220px">
    <div ref="chartEl" style="width: 100%; height: 220px" />
  </div>
</template>
