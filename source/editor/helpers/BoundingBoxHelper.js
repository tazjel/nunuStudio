"use strict";

function BoundingBoxHelper(object, hex)
{
	var color = (hex !== undefined) ? hex : 0x888888;

	this.object = object;
	
	Mesh.call(this, new THREE.BoxBufferGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: color, wireframe: true}));

	this.box = new Box3();
	this.box.setFromObject(this.object);
	this.box.getSize(this.scale);
	this.box.getCenter(this.position);
}

BoundingBoxHelper.prototype = Object.create(Mesh.prototype);

BoundingBoxHelper.prototype.update = function()
{
	this.box.setFromObject(this.object);
	this.box.getSize(this.scale);
	this.box.getCenter(this.position);
};
