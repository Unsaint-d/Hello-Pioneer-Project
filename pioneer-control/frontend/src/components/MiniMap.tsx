import React, { useContext, useEffect, useRef, useState } from 'react';
import { LocateFixed, Maximize, Redo2, Undo2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import type { FlightPoint } from '../types';
import { HOME_POINT_ID } from '../utils/flightPlan';

const MiniMap = () => {
  const context = useContext(AppContext);
  const [viewBox, setViewBox] = useState({ x: -1.2, y: -1.2, w: 2.4, h: 2.4 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const draggedPointId = context?.draggedPointId ?? null;
  const setDraggedPointId = context?.setDraggedPointId ?? (() => {});
  const lastPosRef = useRef({ x: 0, y: 0 });
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });
  const [hideScales, setHideScales] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | null>(null);
  const wheelRafRef = useRef<number | null>(null);
  const wheelStateRef = useRef<{ deltaY: number; clientX: number; clientY: number }>({ deltaY: 0, clientX: 0, clientY: 0 });
  const dragRafRef = useRef<number | null>(null);
  const dragDeltaRef = useRef({ dx: 0, dy: 0 });

  const getSVGCoordinates = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: svgP.x, y: svgP.y };
  };

  const clusterPoints = (points: FlightPoint[], radius: number) => {
    const clusters: { points: FlightPoint[]; indices: number[] }[] = [];
    const scale = svgSize.width && svgSize.height ? Math.min(svgSize.width / viewBox.w, svgSize.height / viewBox.h) : 1;
    const pointToScreen = (p: FlightPoint) => ({
      x: (p.x - viewBox.x) * scale,
      y: (-p.y - viewBox.y) * scale
    });

    const visited = new Array(points.length).fill(false);

    for (let i = 0; i < points.length; i++) {
      if (visited[i]) continue;

      const currentClusterPoints = [points[i]];
      const currentClusterIndices = [i];
      visited[i] = true;

      const p1Screen = pointToScreen(points[i]);

      for (let j = i + 1; j < points.length; j++) {
        if (visited[j]) continue;

        const p2Screen = pointToScreen(points[j]);
        const distance = Math.sqrt(Math.pow(p1Screen.x - p2Screen.x, 2) + Math.pow(p1Screen.y - p2Screen.y, 2));

        if (distance < radius) {
          currentClusterPoints.push(points[j]);
          currentClusterIndices.push(j);
          visited[j] = true;
        }
      }
      clusters.push({ points: currentClusterPoints, indices: currentClusterIndices });
    }
    return clusters;
  };

  const animateTo = (targetX: number, targetY: number, targetW?: number, targetH?: number) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const startX = viewBox.x;
    const startY = viewBox.y;
    const startW = viewBox.w;
    const startH = viewBox.h;
    const finalW = targetW ?? startW;
    const finalH = targetH ?? startH;
    let start: number | null = null;
    const duration = 400;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setViewBox({
        x: startX + (targetX - startX) * ease,
        y: startY + (targetY - startY) * ease,
        w: startW + (finalW - startW) * ease,
        h: startH + (finalH - startH) * ease
      });
      if (progress < 1) animationRef.current = requestAnimationFrame(step);
    };
    animationRef.current = requestAnimationFrame(step);
  };

  const centerOnSelected = () => {
    const point = state.points.find(p => p.id === state.selectedPointId);
    if (!point) return;
    animateTo(point.x - viewBox.w / 2, -point.y - viewBox.h / 2);
  };

  const centerToAllPoints = () => {
    setHideScales(true);
    if (state.points.length === 0) {
      animateTo(-1.2, -1.2, 2.4, 2.4);
      return;
    }
    const margin = 0.5;
    const xs = state.points.map(p => p.x);
    const ys = state.points.map(p => -p.y);
    const minX = Math.min(...xs) - margin;
    const maxX = Math.max(...xs) + margin;
    const minY = Math.min(...ys) - margin;
    const maxY = Math.max(...ys) + margin;
    const size = Math.max(maxX - minX, maxY - minY, 1);
    animateTo((minX + maxX) / 2 - size / 2, (minY + maxY) / 2 - size / 2, size, size);
  };

  const gridStep = 0.5;

  const getTicks = (min: number, max: number, step: number) => {
    const start = Math.floor(min / step) * step;
    const end = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let v = start; v <= end + 1e-9; v += step) {
      ticks.push(Number(v.toFixed(2)));
    }
    return ticks;
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setHideScales(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      const wheelState = wheelStateRef.current;
      wheelState.deltaY += event.deltaY;
      wheelState.clientX = event.clientX;
      wheelState.clientY = event.clientY;
      if (wheelRafRef.current) return;
      wheelRafRef.current = requestAnimationFrame(() => {
        wheelRafRef.current = null;
        const { deltaY, clientX, clientY } = wheelStateRef.current;
        wheelStateRef.current.deltaY = 0;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        const scaleFactorRaw = Math.exp(deltaY * 0.001);
        const scaleFactor = Math.min(1.3, Math.max(0.7, scaleFactorRaw));
        setViewBox(prev => {
          const newW = Math.min(Math.max(prev.w * scaleFactor, 0.1), 7);
          const newH = Math.min(Math.max(prev.h * scaleFactor, 0.1), 7);
          const actualScaleFactorW = newW / prev.w;
          const actualScaleFactorH = newH / prev.h;
          const dx = (svgPoint.x - prev.x) * (1 - actualScaleFactorW);
          const dy = (svgPoint.y - prev.y) * (1 - actualScaleFactorH);
          return { x: prev.x + dx, y: prev.y + dy, w: newW, h: newH };
        });
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      svg.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const updateSize = () => {
      setSvgSize({ width: svg.clientWidth, height: svg.clientHeight });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (draggedPointId) {
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.userSelect = '';
    };
  }, [draggedPointId]);

  if (!context) return null;
  const { state, addPoint, selectPoint, updatePoint, undo, redo, canUndo, canRedo } = context;
  const isDark = state.darkMode;
  const axisTextClass = isDark ? 'text-white/70' : 'text-black/70';
  const axisLineClass = isDark ? 'bg-white/60' : 'bg-black/60';
  const xTicks = getTicks(viewBox.x, viewBox.x + viewBox.w, gridStep);
  const yTicks = getTicks(viewBox.y, viewBox.y + viewBox.h, gridStep);
  const scale = svgSize.width && svgSize.height ? Math.min(svgSize.width / viewBox.w, svgSize.height / viewBox.h) : 1;
  const offsetX = svgSize.width ? (svgSize.width - viewBox.w * scale) / 2 : 0;
  const offsetY = svgSize.height ? (svgSize.height - viewBox.h * scale) / 2 : 0;
  const gridExtraX = scale ? offsetX / scale : 0;
  const gridExtraY = scale ? offsetY / scale : 0;
  const gridMinX = viewBox.x - gridExtraX;
  const gridMaxX = viewBox.x + viewBox.w + gridExtraX;
  const gridMinY = viewBox.y - gridExtraY;
  const gridMaxY = viewBox.y + viewBox.h + gridExtraY;
  const gridXTicks = getTicks(gridMinX, gridMaxX, gridStep);
  const gridYTicks = getTicks(gridMinY, gridMaxY, gridStep);
  const pointRadius = 0.07;
  const getArrowEnd = (fromX: number, fromY: number, toX: number, toY: number) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy);
    if (len <= pointRadius) return { x: toX, y: toY };
    const scale = (len - pointRadius) / len;
    return { x: fromX + dx * scale, y: fromY + dy * scale };
  };

  const pointClusters = clusterPoints(state.points, 25);

  const handleMouseDown = (e: React.MouseEvent) => {
    setHideScales(false);
    const coords = { x: e.clientX, y: e.clientY };
    mouseDownPosRef.current = coords;
    lastPosRef.current = coords;
    const target = e.target as SVGElement;
    const marker = target.closest('.point-marker');
    const clusterText = target.closest('.cluster-label');
    
    if (clusterText) {
      // Find which cluster was clicked by text content
      const textElement = clusterText.querySelector('text');
      if (textElement && textElement.textContent) {
        // Numbers are separated by space now, not comma
        const indices = textElement.textContent.trim().split(/\s+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
        
        const currentSelectedId = state.selectedPointId;
        // Find points corresponding to these indices
        // Warning: state.points indices must match the rendered numbers. 
        // The cluster logic uses array indices.
        const pointsInCluster = state.points.filter((_, idx) => indices.includes(idx));
        
        if (pointsInCluster.length > 0) {
            let nextPointToSelect = pointsInCluster[0];
            if (currentSelectedId) {
              const currentIndexInCluster = pointsInCluster.findIndex(p => p.id === currentSelectedId);
              if (currentIndexInCluster !== -1) {
                nextPointToSelect = pointsInCluster[(currentIndexInCluster + 1) % pointsInCluster.length];
              }
            }
            
            if (nextPointToSelect) {
              selectPoint(nextPointToSelect.id);
              e.stopPropagation();
              return;
            }
        }
      }
    }

    if (marker) {
      const id = marker.getAttribute('data-id');
      if (id) {
        selectPoint(id);
        if (id !== HOME_POINT_ID) {
          setDraggedPointId(id);
        }
        e.stopPropagation();
        return;
      }
    }
    setIsDraggingMap(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedPointId) {
      const svgCoords = getSVGCoordinates(e.clientX, e.clientY);
      updatePoint(draggedPointId, {
        x: Math.round(svgCoords.x * 100) / 100,
        y: Math.round(-svgCoords.y * 100) / 100
      });
    } else if (isDraggingMap) {
      const prevSvg = getSVGCoordinates(lastPosRef.current.x, lastPosRef.current.y);
      const currSvg = getSVGCoordinates(e.clientX, e.clientY);
      const dx = currSvg.x - prevSvg.x;
      const dy = currSvg.y - prevSvg.y;
      dragDeltaRef.current.dx += dx;
      dragDeltaRef.current.dy += dy;
      if (!dragRafRef.current) {
        dragRafRef.current = requestAnimationFrame(() => {
          dragRafRef.current = null;
          const { dx: accDx, dy: accDy } = dragDeltaRef.current;
          dragDeltaRef.current = { dx: 0, dy: 0 };
          if (accDx !== 0 || accDy !== 0) {
            setViewBox(prev => ({ ...prev, x: prev.x - accDx, y: prev.y - accDy }));
          }
        });
      }
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const dist = Math.sqrt(Math.pow(e.clientX - mouseDownPosRef.current.x, 2) + Math.pow(e.clientY - mouseDownPosRef.current.y, 2));
    if (!draggedPointId && isDraggingMap && dist < 5) {
      const svgCoords = getSVGCoordinates(e.clientX, e.clientY);
      addPoint({
        x: Math.round(svgCoords.x * 100) / 100,
        y: Math.round(-svgCoords.y * 100) / 100
      });
    }
    setDraggedPointId(null);
    setIsDraggingMap(false);
  };

  const handleMouseLeave = () => {
    if (draggedPointId) setDraggedPointId(null);
    setIsDraggingMap(false);
  };

  return (
    <div className="bg-white border-2 border-black rounded-[18px] overflow-hidden relative shadow-sm h-full select-none">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button onClick={centerToAllPoints} title="Показать всё" className={`${isDark ? 'bg-zinc-800 text-white' : 'bg-white text-black'} border-2 border-black p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]`}><Maximize size={16} /></button>
        <button disabled={!canUndo} onClick={undo} title="Отмена" className={`${isDark ? 'bg-zinc-800 text-white' : 'bg-white text-black'} border-2 border-black p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-30`}><Undo2 size={16} /></button>
        <button disabled={!canRedo} onClick={redo} title="Повтор" className={`${isDark ? 'bg-zinc-800 text-white' : 'bg-white text-black'} border-2 border-black p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-30`}><Redo2 size={16} /></button>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <button onClick={centerOnSelected} disabled={!state.selectedPointId} className={`${isDark ? 'bg-zinc-800 text-white disabled:text-zinc-600' : 'bg-white text-black disabled:text-gray-300'} border-2 border-black p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] disabled:shadow-none transition-all flex items-center gap-2 group`}>
          <LocateFixed size={16} className={state.selectedPointId ? 'text-yellow-500 animate-pulse' : ''} />
          <span className="text-[10px] font-black uppercase hidden group-hover:block">На точку</span>
        </button>
      </div>

      {!hideScales && (
        <div className="absolute inset-0 pointer-events-none z-[5]">
          {yTicks.map(tick => {
            const top = offsetY + (tick - viewBox.y) * scale;
            if (top < offsetY - 10 || top > offsetY + viewBox.h * scale + 10) return null;
            return (
              <div key={`y-scale-${tick}`} className="absolute flex items-center" style={{ left: '0px', top: `${top}px`, transform: 'translateY(-50%)' }}>
                <div className="pl-2 pr-1 flex items-center">
                  <div className={`text-[10px] font-bold ${axisTextClass} w-6 text-right`}>{(-tick).toFixed(1)}</div>
                  <div className={`h-px w-2 ${axisLineClass}`} />
                </div>
              </div>
            );
          })}
          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none">
            {xTicks.map(tick => {
              const left = offsetX + (tick - viewBox.x) * scale;
              if (left < offsetX - 10 || left > offsetX + viewBox.w * scale + 10) return null;
              if (left < 40) return null;
              return (
                <div key={`x-scale-${tick}`} className="absolute" style={{ left: `${left}px`, bottom: '0px', transform: 'translateX(-50%)' }}>
                  <div className="pb-2 pt-1 flex flex-col items-center">
                    <div className={`w-px h-2 ${axisLineClass}`} />
                    <div className={`mt-0.5 text-[10px] font-bold ${axisTextClass}`}>{tick.toFixed(1)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className={`w-full h-full cursor-crosshair touch-none ${isDark ? 'bg-zinc-950' : 'bg-[#f8f8f8]'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.05" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#F9C800" />
          </marker>
          <marker id="arrow-dashed" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#F9C800" opacity="0.8" />
          </marker>
        </defs>
        <g pointerEvents="none">
          {gridXTicks.map((x) => (
            <line key={`grid-x-${x}`} x1={x} y1={gridMinY} x2={x} y2={gridMaxY} stroke={isDark ? '#2A2A2A' : 'rgba(0,0,0,0.1)'} strokeWidth="0.02" />
          ))}
          {gridYTicks.map((y) => (
            <line key={`grid-y-${y}`} x1={gridMinX} y1={y} x2={gridMaxX} y2={y} stroke={isDark ? '#2A2A2A' : 'rgba(0,0,0,0.1)'} strokeWidth="0.02" />
          ))}
        </g>
        <g transform="translate(0, 0)" pointerEvents="none">
          <circle r="0.12" fill={isDark ? 'rgba(249,200,0,0.15)' : 'rgba(249,200,0,0.2)'} stroke={isDark ? '#F9C800' : '#B45309'} strokeWidth="0.02" />
          <circle r="0.03" fill={isDark ? '#F9C800' : '#B45309'} />
          <line x1="-0.18" y1="0" x2="-0.06" y2="0" stroke={isDark ? '#F9C800' : '#B45309'} strokeWidth="0.02" />
          <line x1="0.06" y1="0" x2="0.18" y2="0" stroke={isDark ? '#F9C800' : '#B45309'} strokeWidth="0.02" />
          <line x1="0" y1="-0.18" x2="0" y2="-0.06" stroke={isDark ? '#F9C800' : '#B45309'} strokeWidth="0.02" />
          <line x1="0" y1="0.06" x2="0" y2="0.18" stroke={isDark ? '#F9C800' : '#B45309'} strokeWidth="0.02" />
          <text x="-0.118" y="0.31" fontSize="0.08" fill={isDark ? '#F9C800' : '#B45309'} fontWeight="bold">HOME</text>
        </g>
        {state.points.length > 1 && (
          <>
            {state.points.slice(1).map((p, i) => {
              const prev = state.points[i];
              const fromX = prev.x;
              const fromY = -prev.y;
              const toX = p.x;
              const toY = -p.y;
              const end = getArrowEnd(fromX, fromY, toX, toY);
              return (
                <line
                  key={`line-${i}`}
                  x1={fromX}
                  y1={fromY}
                  x2={end.x}
                  y2={end.y}
                  stroke="#F9C800"
                  strokeWidth="0.02"
                  markerEnd="url(#arrow)"
                />
              );
            })}
            {(() => {
              const last = state.points[state.points.length - 1];
              const first = state.points[0];
              const fromX = last.x;
              const fromY = -last.y;
              const toX = first.x;
              const toY = -first.y;
              const end = getArrowEnd(fromX, fromY, toX, toY);
              return (
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={end.x}
                  y2={end.y}
                  stroke="#F9C800"
                  strokeWidth="0.015"
                  strokeDasharray="0.05, 0.03"
                  opacity={state.isLooped ? 0.8 : 0}
                  markerEnd="url(#arrow-dashed)"
                />
              );
            })()}
          </>
        )}
        {pointClusters.map((cluster) => {
          const avgX = cluster.points.reduce((sum, p) => sum + p.x, 0) / cluster.points.length;
          const avgY = cluster.points.reduce((sum, p) => sum - p.y, 0) / cluster.points.length;
          const clusterLabel = cluster.indices.map(i => i).join(', ');
          const clusterLabelWidth = Math.max(0.32, clusterLabel.length * 0.06);
          const clusterLabelFill = isDark ? '#27272a' : '#ffffff';
          const clusterLabelStroke = isDark ? '#e4e4e7' : '#111827';
          const clusterLabelText = isDark ? '#f4f4f5' : '#111827';

          return (
            <g key={`cluster-${cluster.indices.join('-')}`}>
              {cluster.points.map((p) => {
                const isSelected = state.selectedPointId === p.id;
                const originalIndex = state.points.findIndex(originalP => originalP.id === p.id);
                const isHomePoint = p.id === HOME_POINT_ID;
                const baseFill = isHomePoint ? '#F9C800' : (isDark ? '#18181b' : '#ffffff');
                const baseStroke = isSelected ? '#F9C800' : (isDark ? '#e4e4e7' : '#111827');
                const coreFill = isSelected ? '#F9C800' : (isHomePoint ? '#111827' : (isDark ? '#52525b' : '#d4d4d8'));
                const labelFill = (isSelected || isHomePoint) ? '#F9C800' : (isDark ? '#27272a' : '#ffffff');
                const labelStroke = isDark ? '#e4e4e7' : '#111827';
                const labelText = (isSelected || isHomePoint) ? '#111827' : (isDark ? '#f4f4f5' : '#111827');
                return (
                  <g key={p.id} data-id={p.id} className={`point-marker ${isHomePoint ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`} transform={`translate(${p.x}, ${-p.y})`}>
                    {isSelected && (
                      <circle r="0.1" fill="#F9C800" fillOpacity="0.4" filter="url(#glow)" pointerEvents="none">
                        <animate attributeName="r" values="0.1;0.4" dur="1.2s" repeatCount="indefinite" />
                        <animate attributeName="fill-opacity" values="0.4;0" dur="1.2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle r="0.13" fill="transparent" />
                    <circle r="0.09" fill={baseFill} stroke={baseStroke} strokeWidth="0.02" />
                    <circle r="0.045" fill={coreFill} />
                    {cluster.points.length === 1 && (
                      <g transform="translate(0, -0.18)">
                        <rect x="-0.14" y="-0.08" width="0.28" height="0.16" rx="0.04" fill={labelFill} stroke={labelStroke} strokeWidth="0.015" />
                        <text y="0.03" textAnchor="middle" fontSize="0.1" fill={labelText} fontWeight="bold">{originalIndex}</text>
                      </g>
                    )}
                  </g>
                );
              })}
              {cluster.points.length > 1 && (
                <g transform={`translate(${avgX}, ${avgY - 0.2})`} className="cursor-pointer cluster-label" onClick={(e) => { e.stopPropagation(); /* TODO: Show list to select */ }}>
                  <rect x={-clusterLabelWidth / 2} y="-0.08" width={clusterLabelWidth} height="0.16" rx="0.04" fill={clusterLabelFill} stroke={clusterLabelStroke} strokeWidth="0.015" />
                  
                  {cluster.points.some(p => p.id === state.selectedPointId) && (() => {
                     // Logic for rendering highlight is handled below
                     return null; 
                   })()}

                  <text y="0.03" textAnchor="middle" fontSize="0.1" fill={clusterLabelText} fontWeight="bold">
                    {cluster.indices.map((idx, i) => {
                       const point = cluster.points[i];
                       const isSelected = state.selectedPointId === point.id;
                       return (
                         <tspan key={point.id} fill={isSelected ? '#F9C800' : 'currentColor'}>
                           {idx}{i < cluster.indices.length - 1 ? ' ' : ''}
                         </tspan>
                       );
                    })}
                  </text>
                  
                   {/* Highlighting rectangle logic */}
                   {(() => {
                      const selectedPointIndex = cluster.points.findIndex(p => p.id === state.selectedPointId);
                      if (selectedPointIndex !== -1) {
                         const parts = cluster.indices.map(String);
                         const partWidths = parts.map(s => s.length * 0.06);
                         const separatorWidth = 0.04; // space for " "
                         
                         const totalContentWidth = partWidths.reduce((a, b) => a + b, 0) + (parts.length - 1) * separatorWidth;
                         const startX = -totalContentWidth / 2;
                         
                         let currentX = startX;
                         let targetX = 0;
                         let targetWidth = 0;
                         
                         for (let i = 0; i < parts.length; i++) {
                            if (i === selectedPointIndex) {
                               targetX = currentX;
                               targetWidth = partWidths[i];
                               break;
                            }
                            currentX += partWidths[i] + separatorWidth;
                         }
                         
                         return (
                           <rect 
                             x={targetX - 0.02} 
                             y="-0.08" 
                             width={targetWidth + 0.04} 
                             height="0.16" 
                             rx="0.03" 
                             fill="#F9C800" 
                             opacity="0.3"
                             className="transition-all duration-300 ease-out"
                           />
                         );
                      }
                      return null;
                   })()}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default MiniMap;
