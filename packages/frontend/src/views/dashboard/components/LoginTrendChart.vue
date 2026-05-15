<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([TitleComponent, TooltipComponent, GridComponent, LineChart, CanvasRenderer])

const props = defineProps<{
  labels: string[]
  data: number[]
  loading: boolean
}>()

const chartEl = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

function buildOption() {
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => `${params[0].name}<br/>登入次數：<b>${params[0].value}</b>`,
    },
    grid: { left: 36, right: 16, top: 20, bottom: 24 },
    xAxis: {
      type: 'category',
      data: props.labels,
      axisLine: { lineStyle: { color: '#e0e4ef' } },
      axisTick: { show: false },
      axisLabel: { color: '#8b9ab5', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#f0f2f8', type: 'dashed' } },
      axisLabel: { color: '#8b9ab5', fontSize: 12 },
    },
    series: [
      {
        type: 'line',
        data: props.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(79,106,245,0.18)' },
            { offset: 1, color: 'rgba(79,106,245,0)' },
          ]),
        },
        lineStyle: { color: '#4F6AF5', width: 2.5 },
        itemStyle: { color: '#4F6AF5', borderWidth: 2, borderColor: '#fff' },
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

watch(() => [props.labels, props.data], () => {
  chart?.setOption(buildOption())
})
</script>

<template>
  <div v-loading="loading" style="min-height: 220px">
    <div ref="chartEl" style="width: 100%; height: 220px" />
  </div>
</template>
