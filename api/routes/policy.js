/*    Copyright 2016 Firewalla LLC 
 *
 *    This program is free software: you can redistribute it and/or  modify
 *    it under the terms of the GNU Affero General Public License, version 3,
 *    as published by the Free Software Foundation.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict'

let express = require('express');
let router = express.Router();
let bodyParser = require('body-parser')

let PM2 = require('../../alarm/PolicyManager2.js');
let pm2 = new PM2();

router.get('/list', (req, res, next) => {
  pm2.loadActivePolicys((err, list) => {
    if(err) {
      res.status(500).send('');
    } else {
      res.json({list: list});
    }
  });
});

router.get('/:policy', (req, res, next) => {
  let policyID = req.params.policy;

  pm2.getPolicy(policyID)
    .then((policy) => res.json(policy))
    .catch((err) => res.status(400).send(err + ""));
});


// create application/json parser 
let jsonParser = bodyParser.json()

router.post('/create',
            jsonParser,
            (req, res, next) => {
              pm2.createPolicyFromJson(req.body, (err, policy) => {
                if(err) {
                  res.status(400).send("Invalid policy data");
                  return;
                }
                
                pm2.checkAndSave(policy, (err, policyID) => {
                  if(err) {
                    res.status(500).send('Failed to create json: ' + err);
                  } else {
                    res.status(201).json({policyID:policyID});
                  }
                });
              });
            });

router.post('/create/ip_port',
            (req, res, next) => {
              let ip = req.query.ip;
              let protocol = req.query.protocol;
              let port = req.query.port;
              let name = req.query.name;

              let json = {
                target: ip,
                target_protocol: protocol,
                target_port: port,
                target_name: name,
                type: "ip_port"
              };
              
              pm2.createPolicyFromJson(json, (err, policy) => {
                if(err) {
                  res.status(400).send("Invalid policy data");
                  return;
                }
                
                pm2.checkAndSave(policy, (err, policyID) => {
                  if(err) {
                    res.status(400).send('Failed to create json: ' + err);
                  } else {
                    res.status(201).json({policyID:policyID});
                  }
                });
              });
            });


router.post('/delete',
            (req, res, next) => {
              let id = req.query.id;

              pm2.disableAndDeletePolicy(id)
                .then(() => {
                  res.status(200).json({status: "success"});
                }).catch((err) => {
                  res.status(400).send('Failed to delete policy: ' + err);
                });
            });

module.exports = router;
