function ParticleEditor(parent)
{
	//Parent
	if(parent === undefined)
	{
		this.parent = document.body;
	}
	else
	{
		this.parent = parent;
	}
	
	//ID
	var id = "particle_editor" + ParticleEditor.id;
	ParticleEditor.id++;

	//Create element
	this.element = document.createElement("div");
	this.element.id = id;
	this.element.style.position = "absolute";

	//Prevent Drop event
	this.element.ondrop = function(event)
	{
		event.preventDefault();
	};

	//Prevent deafault when object dragged over
	this.element.ondragover = function(event)
	{
		event.preventDefault();
	};

	//Main container
	this.main = new DualDivisionResizable(this.element);
	this.main.tab_position = 0.7;
	this.main.tab_position_min = 0.3;
	this.main.tab_position_max = 0.7;
	this.main.updateInterface();

	//Set main div B as panel
	this.main.div_b.className = "panel";

	//Self pointer
	var self = this;

	//----------------------------Particle preview----------------------------
	//Canvas
	this.canvas = new Canvas(this.main.div_a);
	this.canvas.updateInterface();

	//Element atributes
	this.children = [];
	this.fit_parent = false;
	this.size = new THREE.Vector2(0,0);
	this.position = new THREE.Vector2(0,0);
	this.visible = true;

	//Particle renderer and scene
	this.renderer = new THREE.WebGLRenderer({canvas: this.canvas.element, antialias: Settings.antialiasing});
	this.renderer.setSize(this.canvas.size.x, this.canvas.size.y);
	this.renderer.shadowMap.enabled = false;
	
	//Particle preview scene
	this.scene = new Scene();
	this.scene.add(new AmbientLight(0xffffff));
	var grid = new THREE.GridHelper(50, 50, 0x888888);
	grid.material.depthWrite = false;
	this.scene.add(grid);
	var axis = new THREE.AxisHelper(50);
	axis.material.depthWrite = false;
	this.scene.add(axis);

	//Particle
	this.particle = null;
	this.particle_runtime = null;

	//Camera
	this.camera = new PerspectiveCamera(90, this.canvas.size.x/this.canvas.size.y, 0.1, 10000000);
	this.camera_rotation = new THREE.Vector2(0, 0.5);
	this.camera_distance = 5;
	this.updateCamera();

	//-----------------------------Particle parameters------------------------------
	this.form = new Form(this.main.div_b);
	this.form.position.set(10, 8);
	this.form.spacing.set(10, 5);
	
	//Name
	this.form.addText("Name");
	this.name = new TextBox(this.form.element);
	this.name.size.set(200, 18);
	this.name.setOnChange(function()
	{
		if(self.particle !== null)
		{
			self.particle.name = self.name.getText();
			Editor.updateObjectViews();
		}
	});
	this.form.add(this.name);
	this.form.nextRow();

	//Texture map
	this.form.addText("Texture");
	this.form.nextRow();
	this.texture = new ImageBox(this.form.element);
	this.texture.size.set(100, 100);
	this.texture.updateInterface();
	this.texture.setOnChange(function(file)
	{
		self.particle.group.texture = new Texture(file);
		setTimeout(function()
		{
			self.updateRuntimeParticle();
		}, 100);
	});
	this.form.add(this.texture);
	this.form.nextRow();

	//Max particle count
	this.form.addText("Particle count");
	this.maxParticleCount = new NumberBox(this.form.element);
	this.maxParticleCount.size.set(100, 18);
	this.maxParticleCount.setOnChange(function()
	{
		self.particle.group.maxParticleCount = self.maxParticleCount.getValue();
		self.updateRuntimeParticle();
	});
	this.form.add(this.maxParticleCount);
	this.form.nextRow();

	//Blending mode
	this.form.addText("Blending Mode");
	this.blending = new DropdownList(this.form.element);
	this.blending.size.set(120, 18);
	this.blending.addValue("None", THREE.NoBlending);
	this.blending.addValue("Normal", THREE.NormalBlending);
	this.blending.addValue("Additive", THREE.AdditiveBlending);
	this.blending.addValue("Subtractive", THREE.SubtractiveBlending);
	this.blending.addValue("Multiply", THREE.MultiplyBlending);
	this.blending.setOnChange(function()
	{
		self.particle.group.blending = self.blending.getValue();
		self.updateRuntimeParticle();
	});
	this.form.add(this.blending);
	this.form.nextRow();

	//Direction (Time scale)
	this.form.addText("Direction");
	this.direction = new DropdownList(this.form.element);
	this.direction.size.set(100, 18);
	this.direction.addValue("Forward", 1);
	this.direction.addValue("Backward", -1);
	this.direction.setOnChange(function()
	{
		self.particle.emitter.direction = self.direction.getValue();
		self.updateRuntimeParticle();
	});
	this.form.add(this.direction);
	this.form.nextRow();

	//Particle Count
	this.form.addText("Particle rate");
	this.particleCount = new NumberBox(this.form.element);
	this.particleCount.size.set(100, 18);
	this.particleCount.setOnChange(function()
	{
		self.particle.emitter.particleCount = self.particleCount.getValue();
		self.updateRuntimeParticle();
	});
	this.form.add(this.particleCount);
	this.form.nextRow();

	//Particle Duration
	this.form.addText("Duration");
	this.duration = new NumberBox(this.form.element);
	this.duration.size.set(60, 18);
	this.duration.setRange(0, Number.MAX_SAFE_INTEGER);
	this.duration.setOnChange(function()
	{
		var duration = self.duration.getValue();
		if(duration === 0)
		{
			duration = null;
		}
		self.particle.emitter.duration = duration;
		self.updateRuntimeParticle();
	});
	this.form.add(this.duration);
	this.form.nextRow();

	//Emmitter type
	this.form.addText("Emitter Type");
	this.type = new DropdownList(this.form.element);
	this.type.size.set(100, 18);
	this.type.addValue("Box", SPE.distributions.BOX);
	this.type.addValue("Sphere", SPE.distributions.SPHERE);
	this.type.addValue("Disc", SPE.distributions.DISC);
	this.type.setOnChange(function()
	{
		self.particle.emitter.type = self.type.getValue();
		self.updateRuntimeParticle();
	});
	this.form.add(this.type);
	this.form.nextRow();

	//Max age
	this.form.addText("Max Age");
	this.maxAge_value = new NumberBox(this.form.element);
	this.maxAge_value.size.set(60, 18);
	this.maxAge_value.setRange(0, Number.MAX_SAFE_INTEGER);
	this.maxAge_value.setOnChange(function()
	{
		self.particle.emitter.maxAge.value = self.maxAge_value.getValue();
		self.updateRuntimeParticle();
	});
	this.form.add(this.maxAge_value);
	this.form.addText("+/-");
	this.maxAge_spread = new NumberBox(this.form.element);
	this.maxAge_spread.size.set(60, 18);
	this.maxAge_spread.setRange(0, Number.MAX_SAFE_INTEGER);
	this.maxAge_spread.setOnChange(function()
	{
		self.particle.emitter.maxAge.spread = self.maxAge_spread.getValue();
		self.updateRuntimeParticle();
	});
	this.form.add(this.maxAge_spread);
	this.form.nextRow();

	//Position
	this.form.addText("Position");



	//Add element to document
	this.parent.appendChild(this.element);
}

//Particleeditor counter
ParticleEditor.id = 0;

//Functions Prototype
ParticleEditor.prototype.attachParticle = attachParticle;
ParticleEditor.prototype.activate = activate;
ParticleEditor.prototype.destroy = destroy;
ParticleEditor.prototype.update = update;
ParticleEditor.prototype.updateInterface = updateInterface;
ParticleEditor.prototype.updateMetadata = updateMetadata;
ParticleEditor.prototype.updateCamera = updateCamera;
ParticleEditor.prototype.updateRuntimeParticle = updateRuntimeParticle;

//Update container object data
function updateMetadata(container)
{
	if(this.particle !== null)
	{
		container.setName(this.particle.name);
	}
}

//Attach particle to particle editor
function attachParticle(particle)
{
	//Attach particle
	this.particle = particle;

	//Update form elements from particle data
	this.name.setText(particle.name);
	this.texture.setImage(particle.group.texture.image.src);
	this.maxParticleCount.setValue(particle.group.maxParticleCount);
	this.blending.setValue(particle.group.blending);
	this.direction.setValue(particle.emitter.direction);
	this.particleCount.setValue(particle.emitter.particleCount);
	if(particle.emitter.duration !== null)
	{
		this.duration.setValue(particle.emitter.duration);
	}
	else
	{
		this.duration.setValue(0);
	}
	this.type.setValue(particle.emitter.type);
	this.maxAge_value.setValue(particle.emitter.maxAge.value);
	this.maxAge_spread.setValue(particle.emitter.maxAge.spread);


	//Create runtime particle to preview particle
	this.updateRuntimeParticle();
}

//Updates runtime particle to match attached particle
function updateRuntimeParticle()
{
	if(this.particle !== null)
	{
		if(this.particle_runtime !== null)
		{
			this.scene.remove(this.particle_runtime);
		}

		this.particle_runtime = new ObjectLoader().parse(this.particle.toJSON());
		this.particle_runtime.scale.set(1, 1, 1);
		this.particle_runtime.position.set(0, 0, 0);
		this.particle_runtime.rotation.set(0, 0, 0);
		this.particle_runtime.initialize();
		this.scene.add(this.particle_runtime);
	}
}

//Update camera position and rotation from variables
function updateCamera()
{
	//Calculate direction vector
	var cos_angle_y = Math.cos(this.camera_rotation.y);
	var position = new THREE.Vector3(this.camera_distance * Math.cos(this.camera_rotation.x)*cos_angle_y, this.camera_distance * Math.sin(this.camera_rotation.y), this.camera_distance * Math.sin(this.camera_rotation.x)*cos_angle_y);
	this.camera.position.copy(position);
	this.camera.lookAt(new THREE.Vector3(0, 0, 0));
}

//Activate code editor
function activate()
{
	//Set editor state
	Editor.setState(Editor.STATE_IDLE);
	Editor.resetEditingFlags();
	
	//Set mouse canvas
	Mouse.canvas = this.canvas.element;
}

//Remove element
function destroy()
{
	try
	{
		this.parent.removeChild(this.element);
	}
	catch(e){}
}

//Update material editor
function update()
{
	//Update UI elements
	this.main.update();

	//Get mouse input
	if(Mouse.insideCanvas())
	{
		//Move camera
		if(Mouse.buttonPressed(Mouse.LEFT))
		{
			this.camera_rotation.x -= 0.003 * Mouse.delta.x;
			this.camera_rotation.y -= 0.003 * Mouse.delta.y;

			//Limit Vertical Rotation to 90 degrees
			var pid2 = 1.57;
			if(this.camera_rotation.y < -pid2)
			{
				this.camera_rotation.y = -pid2;
			}
			else if(this.camera_rotation.y > pid2)
			{
				this.camera_rotation.y = pid2;
			}
		}

		//Camera zoom
		this.camera_distance += Mouse.wheel * 0.005;
		if(this.camera_distance < 0.1)
		{
			this.camera_distance = 0.1;
		}

		this.updateCamera();
	}

	//Update particle and render
	if(this.particle_runtime !== null)
	{
		this.particle_runtime.update();
	}

	//Render editor scene
	this.renderer.render(this.scene, this.camera);
}

//Update division Size
function updateInterface()
{
	//Fit parent
	if(this.fit_parent)
	{
		this.size.x = this.parent.offsetWidth;
		this.size.y = this.parent.offsetHeight; 
	}
	
	//Set visibility
	if(this.visible)
	{
		this.element.style.visibility = "visible";
	}
	else
	{
		this.element.style.visibility = "hidden";
	}

	//Update main container
	this.main.visible = this.visible;
	this.main.size.copy(this.size);
	this.main.updateInterface();

	//Update canvas
	this.canvas.visible = this.visible;
	this.canvas.size.set(this.main.div_a.offsetWidth, this.main.div_a.offsetHeight);
	this.canvas.updateInterface();

	//Update renderer and canvas
	this.renderer.setSize(this.canvas.size.x, this.canvas.size.y);
	this.camera.aspect = this.canvas.size.x/this.canvas.size.y
	this.camera.updateProjectionMatrix();

	//Update children
	for(var i = 0; i < this.children.length; i++)
	{
		this.children[i].visible = this.visible;
		this.children[i].updateInterface();
	}

	//Update form
	this.form.visible = this.visible;
	this.form.updateInterface();

	//Update element
	this.element.style.top = this.position.y + "px";
	this.element.style.left = this.position.x + "px";
	this.element.style.width = this.size.x + "px";
	this.element.style.height = this.size.y + "px";
}