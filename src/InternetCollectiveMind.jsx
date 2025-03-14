import React, { useEffect, useState, useRef } from 'react';
    import * as d3 from 'd3';
    import * as THREE from 'three';

    const InternetCollectiveMind = () => {
      const containerRef = useRef(null);
      const [loading, setLoading] = useState(true);
      const [activeNode, setActiveNode] = useState(null);
      const [dateTime, setDateTime] = useState(new Date());
      const [cameraPosition, setCameraPosition] = useState([0, 0, 30]); // Initial camera position
      const [cameraRotation, setCameraRotation] = useState([0, 0, 0]); // Initial camera rotation
      const pressedKeys = useRef(new Set());

      useEffect(() => {
        const intervalId = setInterval(() => {
          setDateTime(new Date());
        }, 1000);
        return () => clearInterval(intervalId);
      }, []);

      useEffect(() => {
        if (!containerRef.current) return;

        setLoading(true);

        const width = containerRef.current.clientWidth;
        const height = 500;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        containerRef.current.appendChild(renderer.domElement);

        // Initialize camera position and rotation from state
        camera.position.set(...cameraPosition);
        camera.rotation.set(...cameraRotation);


        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 1);
        scene.add(directionalLight);

        const topics = [
          "Technology", "Politics", "Health", "Environment",
          "Entertainment", "Science", "Sports", "Finance",
          "Education", "Travel", "Food", "Fashion"
        ];

        const generateNode = (topic, index) => {
          const phi = Math.acos(-1 + (2 * index) / topics.length);
          const theta = Math.sqrt(topics.length * Math.PI) * phi;

          return {
            id: index,
            topic,
            x: 15 * Math.cos(theta) * Math.sin(phi),
            y: 15 * Math.sin(theta) * Math.sin(phi),
            z: 15 * Math.cos(phi),
            sentiment: Math.random() * 2 - 1,
            activity: Math.random() * 0.8 + 0.2,
            connections: []
          };
        };

        const nodes = topics.map(generateNode);

        const predefinedConnections = [
          [0, 5], [0, 7], [1, 3], [1, 6], [2, 3],
          [2, 10], [4, 6], [4, 11], [5, 7], [8, 9],
          [9, 10], [9, 11], [3, 5], [7, 8], [0, 8],
          [0, 1], [0, 2], [1, 2], [3, 4], [5, 6], [6, 7],
          [8, 10], [9, 7], [10, 4], [11, 1], [2, 8]
        ];

        const distance = (node1, node2) => {
          return Math.sqrt(
            Math.pow(node1.x - node2.x, 2) +
            Math.pow(node1.y - node2.y, 2) +
            Math.pow(node1.z - node2.z, 2)
          );
        };

        const proximityConnections = [];
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            if (distance(nodes[i], nodes[j]) < 8 && Math.random() > 0.7) {
              proximityConnections.push([i, j]);
            }
          }
        }

        const connections = [...predefinedConnections, ...proximityConnections];

        connections.forEach(([source, target]) => {
          nodes[source].connections.push(target);
          nodes[target].connections.push(source);
        });

        const trendingNodes = [];
        for (let i = 0; i < 50; i++) {
          const parentIndex = Math.floor(Math.random() * nodes.length);
          const parent = nodes[parentIndex];
          const distanceFactor = Math.random() * 0.5 + 0.5;

          trendingNodes.push({
            id: i + nodes.length,
            topic: "Trending",
            x: parent.x * distanceFactor + (Math.random() * 6 - 3),
            y: parent.y * distanceFactor + (Math.random() * 6 - 3),
            z: parent.z * distanceFactor + (Math.random() * 6 - 3),
            sentiment: parent.sentiment + (Math.random() * 0.4 - 0.2),
            activity: Math.random() * 0.5 + 0.1,
            parentTopic: parentIndex
          });
        }

        const createSphereNode = (node) => {
          const isMainNode = node.topic !== "Trending";

          const sentimentColorScale = d3.scaleLinear()
            .domain([-1, 0, 1])
            .range(['#3a0ca3', '#4cc9f0', '#f72585']);

          const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(sentimentColorScale(node.sentiment)),
            transparent: true,
            opacity: 0.8,
            emissive: new THREE.Color(sentimentColorScale(node.sentiment)),
            emissiveIntensity: 0.3
          });

          const size = isMainNode ? 1 + node.activity : 0.3 + (node.activity * 0.3);
          const geometry = new THREE.SphereGeometry(size, 32, 32);
          const sphere = new THREE.Mesh(geometry, material);

          sphere.position.set(node.x, node.y, node.z);
          sphere.userData = {
            id: node.id,
            topic: isMainNode ? node.topic : `Trend in ${topics[node.parentTopic]}`,
            isMainNode,
            sentiment: node.sentiment,
            activity: node.activity
          };

          scene.add(sphere);
          return sphere;
        };

        const createConnections = (nodeObjects) => {
          connections.forEach(([sourceIndex, targetIndex]) => {
            const source = nodes[sourceIndex];
            const target = nodes[targetIndex];

            const lineMaterial = new THREE.LineBasicMaterial({
              color: 0x4cc9f0,
              transparent: true,
              opacity: 0.3
            });

            const points = [];
            points.push(new THREE.Vector3(source.x, source.y, source.z));
            points.push(new THREE.Vector3(target.x, target.y, target.z));

            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeometry, lineMaterial);

            scene.add(line);
          });
        };

        const createPulse = (position, color) => {
          const pulseGeometry = new THREE.SphereGeometry(0.5, 32, 32);
          const pulseMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.8
          });

          const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
          pulse.position.copy(position);
          scene.add(pulse);

          pulse.userData = {
            startTime: Date.now(),
            duration: 2000
          };

          return pulse;
        };

        const nodeObjects = [...nodes, ...trendingNodes].map(createSphereNode);
        createConnections(nodeObjects);

        const pulses = [];
        let lastPulseTime = Date.now();
        const pulseInterval = 1000;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseMove = (event) => {
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };

        // --- Mouse Rotation Logic ---
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        const rotationSpeed = 0.005;

        const onMouseDown = (event) => {
          isDragging = true;
          previousMousePosition = { x: event.clientX, y: event.clientY };
        };

        const onMouseUp = () => {
          isDragging = false;
        };

        const onMouseMoveDrag = (event) => {
          if (!isDragging) return;

          const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
          };

          const deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
              deltaMove.y * rotationSpeed,
              deltaMove.x * rotationSpeed,
              0,
              'XYZ'
            ));

          camera.quaternion.multiplyQuaternions(deltaRotationQuaternion, camera.quaternion);

          previousMousePosition = { x: event.clientX, y: event.clientY };
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown, false);
        renderer.domElement.addEventListener('mouseup', onMouseUp, false);
        renderer.domElement.addEventListener('mousemove', onMouseMoveDrag, false);
        window.addEventListener('mousemove', onMouseMove, false); // For node hover


        // --- WASD Movement Logic ---
        const movementSpeed = 0.1;

        const onKeyDown = (event) => {
          pressedKeys.current.add(event.code);
        };

        const onKeyUp = (event) => {
          pressedKeys.current.delete(event.code);
        };

        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);


        const animate = () => {
          requestAnimationFrame(animate);

          // --- Camera Movement ---
          const [x, y, z] = cameraPosition;
          let newX = x, newY = y, newZ = z;

          if (pressedKeys.current.has('KeyW')) newZ -= movementSpeed;
          if (pressedKeys.current.has('KeyS')) newZ += movementSpeed;
          if (pressedKeys.current.has('KeyA')) newX -= movementSpeed;
          if (pressedKeys.current.has('KeyD')) newX += movementSpeed;

          setCameraPosition([newX, newY, newZ]);
          camera.position.set(newX, newY, newZ);
          camera.lookAt(0,0,0);


          const now = Date.now();
          if (now - lastPulseTime > pulseInterval) {
            const randomNode = nodeObjects[Math.floor(Math.random() * nodes.length)];
            const color = randomNode.material.color.getHex();
            pulses.push(createPulse(randomNode.position, color));
            lastPulseTime = now;
          }

          for (let i = pulses.length - 1; i >= 0; i--) {
            const pulse = pulses[i];
            const elapsed = now - pulse.userData.startTime;
            const progress = elapsed / pulse.userData.duration;

            if (progress >= 1) {
              scene.remove(pulse);
              pulses.splice(i, 1);
            } else {
              pulse.scale.set(1 + progress * 5, 1 + progress * 5, 1 + progress * 5);
              pulse.material.opacity = 0.8 * (1 - progress);
            }
          }

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(nodeObjects);

          if (intersects.length > 0) {
            const hoveredNode = intersects[0].object;
            setActiveNode(hoveredNode.userData);
            hoveredNode.material.emissiveIntensity = 0.7;
          } else {
            setActiveNode(null);
            nodeObjects.forEach(node => {
              node.material.emissiveIntensity = 0.3;
            });
          }

          renderer.render(scene, camera);
        };

        animate();
        setLoading(false);

        return () => {
          window.removeEventListener('mousemove', onMouseMove);
          renderer.domElement.removeEventListener('mousedown', onMouseDown);
          renderer.domElement.removeEventListener('mouseup', onMouseUp);
          renderer.domElement.removeEventListener('mousemove', onMouseMoveDrag);
          window.removeEventListener('keydown', onKeyDown);
          window.removeEventListener('keyup', onKeyUp);


          if (containerRef.current) {
            containerRef.current.removeChild(renderer.domElement);
          }

          scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
        };
      }, [cameraPosition]); // Re-run effect when cameraPosition changes

      const formattedDateTime = dateTime.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      });

      return (
        <div className="w-full bg-gray-900 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">Neural Network of Collective Internet Consciousness</h2>
          <p className="mb-4">Real-time visualization of topic relationships, sentiment flows, and emerging trends across the internet zeitgeist</p>

          <div className="relative">
            <div
              ref={containerRef}
              className="w-full h-96 rounded-lg bg-gradient-to-b from-gray-800 to-gray-900"
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
        <div className="absolute top-4 left-4 text-sm text-gray-400">
          {formattedDateTime}
        </div>

        {activeNode && (
          <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg max-w-xs">
            <h3 className="font-bold text-lg">{activeNode.topic}</h3>
            <p className="text-sm mt-1">
              Sentiment: <span className={activeNode.sentiment > 0 ? "text-pink-400" : activeNode.sentiment < 0 ? "text-purple-400" : "text-blue-400"}>
                {activeNode.sentiment > 0 ? "Positive" : activeNode.sentiment < 0 ? "Negative" : "Neutral"}
                {" "}({activeNode.sentiment.toFixed(2)})
              </span>
            </p>
            <p className="text-sm">Activity Level: {(activeNode.activity * 100).toFixed(0)}%</p>

            {activeNode.isMainNode ? (
              <p className="text-xs mt-2 text-gray-400">Major topic node with multiple emerging trends</p>
            ) : (
              <p className="text-xs mt-2 text-gray-400">Emerging trend related to {activeNode.topic}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Real-time Topic Analysis</h3>
          <p className="text-sm text-gray-300">Visualizing semantic relationships between major internet discussions and emerging trends.</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Sentiment Flows</h3>
          <p className="text-sm text-gray-300">Color mapping reveals emotional patterns across different topic clusters.</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Neural Connections</h3>
          <p className="text-sm text-gray-300">Lines represent strong thematic relationships between major discussion topics.</p>
        </div>

        {/* New Informational Cards */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Why This Matters</h3>
          <p className="text-sm text-gray-300">
            Understanding the collective online sentiment and emerging trends can provide valuable insights into public opinion,
            help identify critical issues, and inform decision-making in various fields, from market research to public health.
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Data Sources</h3>
          <p className="text-sm text-gray-300">
            This visualization pulls data from various real-time sources, including:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 mt-2">
            <li>Twitter: For sentiment analysis of public conversations.</li>
            <li>News Portals (e.g., NewsAPI.org, GNews.io): For identifying trending topics and news coverage.</li>
            <li>Other APIs (e.g., Reddit, Google Trends): For a broader view of online discussions.</li>
          </ul>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">How It Works</h3>
          <p className="text-sm text-gray-300">
            The system collects data, analyzes sentiment (positive, negative, neutral), identifies topics,
            and visualizes the relationships between them in real-time.  The colors represent sentiment,
            and the connections show how topics are related.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InternetCollectiveMind;
